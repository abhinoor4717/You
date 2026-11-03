'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FormData = {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    birthday: string;
    age: number;
};

export default function Onboarding() {
    const router = useRouter();

    const [maxDate, setMaxDate] = useState("");

    const [formData, setFormData] = useState<FormData>({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        birthday: "",
        age: 0,
    });

    const [status, setStatus] = useState("");

    useEffect(() => {
        const today = new Date();

        const maxBirthday = new Date(
            today.getFullYear() - 13,
            today.getMonth(),
            today.getDate()
        );

        setMaxDate(formatDate(maxBirthday));
    }, []);

    function formatDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function calculateAge(birthday: string) {
        const [year, month, day] = birthday.split("-").map(Number);
        const today = new Date();

        let age = today.getFullYear() - year;

        const hasHadBirthday =
            today.getMonth() + 1 > month ||
            (
                today.getMonth() + 1 === month &&
                today.getDate() >= day
            );

        if (!hasHadBirthday) {
            age--;
        }

        return age;
    }

    function validateForm(data: FormData): string | null {
        const firstName = data.first_name.trim();
        const lastName = data.last_name.trim();
        const username = data.username.trim();
        const email = data.email.trim();

        // -------------------------
        // First name
        // -------------------------

        if (firstName.length < 1 || firstName.length > 50) {
            return "First name must be between 1 and 50 characters.";
        }

        // Unicode letters + spaces + apostrophes + hyphens
        const nameRegex = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;

        if (!nameRegex.test(firstName)) {
            return "First name contains invalid characters.";
        }

        // -------------------------
        // Last name
        // -------------------------

        if (lastName.length < 1 || lastName.length > 50) {
            return "Last name must be between 1 and 50 characters.";
        }

        if (!nameRegex.test(lastName)) {
            return "Last name contains invalid characters.";
        }

        // -------------------------
        // Username
        // -------------------------

        if (username.length < 3 || username.length > 50) {
            return "Username must be between 3 and 50 characters.";
        }

        // Letters/numbers with optional _, -, or . between them
        const usernameRegex =
            /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/;

        if (!usernameRegex.test(username)) {
            return "Username may only contain letters, numbers, periods, underscores, and hyphens, and cannot start or end with punctuation.";
        }

        // -------------------------
        // Email
        // -------------------------

        if (email.length > 255) {
            return "Email must be 255 characters or fewer.";
        }

        // Basic client-side email sanity check.
        // The server should perform authoritative validation.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return "Please enter a valid email address.";
        }

        // -------------------------
        // Birthday
        // -------------------------

        if (!data.birthday) {
            return "Birthday is required.";
        }

        const birthdayParts = data.birthday.split("-").map(Number);

        if (birthdayParts.length !== 3) {
            return "Please enter a valid birthday.";
        }

        const [year, month, day] = birthdayParts;

        if (
            !year ||
            !month ||
            !day ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return "Please enter a valid birthday.";
        }

        const age = calculateAge(data.birthday);

        if (age < 13) {
            return "You must be at least 13 years old.";
        }

        if (age > 120) {
            return "Please enter a valid birthday.";
        }

        return null;
    }

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = event.target;

        // Birthday also controls age
        if (name === "birthday") {
            const age = value ? calculateAge(value) : 0;

            setFormData((prev) => ({
                ...prev,
                birthday: value,
                age,
            }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        // Normalize strings before validating/sending
        const cleanedData: FormData = {
            ...formData,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            username: formData.username.trim(),
            email: formData.email.trim().toLowerCase(),
        };

        const validationError = validateForm(cleanedData);

        if (validationError) {
            setStatus(validationError);
            return;
        }

        setStatus("Submitting...");

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cleanedData),
            });

            const body = await response.json();

            if (!response.ok) {
                setStatus(
                    body.error ??
                    "Something went wrong."
                );

                return;
            }

            setStatus("Success!");

            setFormData({
                first_name: "",
                last_name: "",
                username: "",
                email: "",
                birthday: "",
                age: 0,
            });

            router.replace("/app");

        } catch (error) {
            setStatus(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        }
    };

    return (
        <div className="p-10">
            <div className="font-mono flex flex-col items-center">
                <h1 className="text-4xl">
                    Onboarding
                </h1>

                <p>
                    We need to collect a little bit more
                    information about you.
                </p>

                <div className="h-px my-8 bg-linear-to-r from-transparent via-gray-400 to-transparent border-0 w-screen" />

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col p-2"
                >
                    {/* Name */}

                    <div className="m-2 flex flex-col w-full">
                        <label>Your name</label>

                        <div className="flex gap-4">
                            <input
                                maxLength={50}
                                onChange={handleChange}
                                value={formData.first_name}
                                required
                                name="first_name"
                                type="text"
                                placeholder="Kitty"
                                autoComplete="given-name"
                                className="border-2xl bg-white text-black pl-2 pr-2 flex-1"
                            />

                            <input
                                maxLength={50}
                                onChange={handleChange}
                                value={formData.last_name}
                                required
                                name="last_name"
                                type="text"
                                placeholder="Lover"
                                autoComplete="family-name"
                                className="border-2xl bg-white text-black pl-2 pr-2 flex-1"
                            />
                        </div>
                    </div>

                    {/* Username */}

                    <div className="m-2 flex flex-col w-full">
                        <label>Username</label>

                        <input
                            minLength={3}
                            maxLength={50}
                            onChange={handleChange}
                            value={formData.username}
                            required
                            name="username"
                            type="text"
                            placeholder="kittylover67"
                            autoComplete="username"
                            className="border-2xl bg-white text-black pl-2 pr-2 flex-1"
                        />
                    </div>

                    {/* Email */}

                    <div className="m-2 flex flex-col w-full">
                        <label>Email</label>

                        <input
                            maxLength={255}
                            onChange={handleChange}
                            value={formData.email}
                            required
                            name="email"
                            type="email"
                            placeholder="kittylover67@gmail.com"
                            autoComplete="email"
                            className="border-2xl bg-white text-black pl-2 pr-2 flex-1"
                        />
                    </div>

                    {/* Birthday / Age */}

                    <div className="m-2 flex flex-col w-full">
                        <div className="flex gap-4 w-full">
                            <div className="flex flex-col flex-1">
                                <label>Birthday</label>

                                <input
                                    max={maxDate}
                                    onChange={handleChange}
                                    value={formData.birthday}
                                    required
                                    name="birthday"
                                    type="date"
                                    autoComplete="bday"
                                    className="border-2xl bg-white text-black pl-2 pr-2 flex-1"
                                />
                            </div>

                            <div className="flex flex-col flex-1">
                                <label>Age</label>

                                <input
                                    value={
                                        formData.birthday
                                            ? formData.age
                                            : ""
                                    }
                                    readOnly
                                    tabIndex={-1}
                                    name="age"
                                    type="number"
                                    className="border-2xl bg-gray-200 text-black pl-2 pr-2 flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="m-2 bg-purple-300 hover:bg-purple-200 hover:cursor-pointer text-black w-min pl-2 pr-2"
                    >
                        Submit
                    </button>

                    {status && (
                        <p className="mt-2 text-sm font-semibold">
                            {status}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}