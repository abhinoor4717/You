'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0"

type FormData = {
    first_name: string;
    last_name: string;
    username: string;
    birthday: string;
    age: number;
    email: string;
};

export default function Onboarding() {
    const router = useRouter();

    const {user, isLoading} = useUser();

    const [maxDate, setMaxDate] = useState("");
    
    const [formData, setFormData] = useState<FormData>({
        first_name: "",
        last_name: "",
        username: "",
        birthday: "",
        age: 0,
        email: ""
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
            email: user!.email!
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
                birthday: "",
                age: 0,
                email: ""
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

    if (isLoading) return "Loading user...";

    return (
  <main className="min-h-screen px-4 py-10 md:px-8">
    <section className="mx-auto w-full max-w-2xl border-4 border-[#262044] bg-white p-6 shadow-[8px_8px_0_#a78bfa] md:p-10">
      <header className="relative">
        <div aria-hidden="true" className="absolute right-1 top-1 flex gap-2">
          <span className="size-3 bg-pink-400" />
          <span className="size-3 bg-cyan-400" />
          <span className="size-3 bg-lime-400" />
        </div>

        <p className="mb-3 inline-block border-2 border-[#262044] bg-cyan-100 px-2 py-1 font-mono text-xs font-bold uppercase tracking-widest text-cyan-900">
          Player setup
        </p>

        <h1 className="text-3xl font-black tracking-tight text-[#262044] md:text-4xl">
          Build your player card
        </h1>

        <p className="mt-3 max-w-lg text-sm leading-6 text-violet-800">
          Add a few details to finish setting up your profile.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <div>
          <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#51496f]">
            Your name
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              maxLength={50}
              onChange={handleChange}
              value={formData.first_name}
              required
              name="first_name"
              type="text"
              placeholder="First name"
              autoComplete="given-name"
              aria-label="First name"
              className="w-full border-2 border-[#262044] bg-[#f7f5ff] px-3 py-3 font-mono text-sm text-[#262044] outline-none placeholder:text-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
            />

            <input
              maxLength={50}
              onChange={handleChange}
              value={formData.last_name}
              required
              name="last_name"
              type="text"
              placeholder="Last name"
              autoComplete="family-name"
              aria-label="Last name"
              className="w-full border-2 border-[#262044] bg-[#f7f5ff] px-3 py-3 font-mono text-sm text-[#262044] outline-none placeholder:text-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="username"
            className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#51496f]"
          >
            Username
          </label>
          <input
            id="username"
            minLength={3}
            maxLength={50}
            onChange={handleChange}
            value={formData.username}
            required
            name="username"
            type="text"
            placeholder="pixelplayer42"
            autoComplete="username"
            className="w-full border-2 border-[#262044] bg-[#f7f5ff] px-3 py-3 font-mono text-sm text-[#262044] outline-none placeholder:text-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <div>
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#51496f]">
            Birthday
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              id="birthday"
              max={maxDate}
              onChange={handleChange}
              value={formData.birthday}
              required
              name="birthday"
              type="date"
              autoComplete="bday"
              aria-label="Birthday"
              className="w-full border-2 border-[#262044] bg-[#f7f5ff] px-3 py-3 font-mono text-sm text-[#262044] outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
            />

            <div>
              <label
                htmlFor="age"
                className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#51496f]"
              >
                Age
              </label>
              <input
                id="age"
                value={formData.birthday ? formData.age : ""}
                readOnly
                tabIndex={-1}
                name="age"
                type="number"
                aria-label="Age calculated from birthday"
                className="w-full border-2 border-[#262044] bg-lime-100 px-3 py-3 font-mono text-sm text-[#262044]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "Submitting..."}
          className="mt-2 w-full border-2 border-[#262044] bg-pink-300 px-5 py-3 font-mono text-sm font-bold text-[#262044] shadow-[4px_4px_0_#262044] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-pink-200 hover:shadow-[5px_5px_0_#262044] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {status === "Submitting..." ? "Saving player..." : "Create profile"}
        </button>

        {status && (
          <p
            role="status"
            aria-live="polite"
            className={`border-2 border-[#262044] p-3 font-mono text-sm ${
              status === "Success!"
                ? "bg-lime-100 text-green-900"
                : status === "Submitting..."
                  ? "bg-cyan-100 text-cyan-900"
                  : "bg-pink-100 text-pink-900"
            }`}
          >
            {status}
          </p>
        )}
      </form>
    </section>
  </main>
);
}