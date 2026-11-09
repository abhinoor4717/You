'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0"
import SiteHeader from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/services/getCurrentUser";

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
            console.log("redirected to app");

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
  <>
    <SiteHeader />
    <main className="flex-1 px-4 py-6 sm:py-10 md:px-8">
    <section className="card mx-auto w-full max-w-2xl p-6 md:p-10">
      <header className="border-b border-divider pb-5">
        <p className="eyebrow mb-3">
          Welcome to You
        </p>

        <h1 className="font-editorial text-4xl leading-tight tracking-tight text-foreground md:text-5xl">
          Make it yours.
        </h1>

        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Add a few details to finish setting up your profile.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
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
              className="form-control"
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
              className="form-control"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted"
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
            className="form-control"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
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
              className="form-control"
            />

            <div>
              <label
                htmlFor="age"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted"
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
                className="form-control"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "Submitting..."}
          className="button-primary mt-2 w-full py-3 text-sm enabled:cursor-pointer disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {status === "Submitting..." ? "Saving player..." : "Create profile"}
        </button>

        {status && (
          <p
            role="status"
            aria-live="polite"
            className={`rounded-lg bg-subtle p-3 text-sm ${
              status === "Success!"
                ? "text-success"
                : status === "Submitting..."
                  ? "text-muted"
                  : "text-danger"
            }`}
          >
            {status}
          </p>
        )}
      </form>
    </section>
    </main>
  </>
);
}
