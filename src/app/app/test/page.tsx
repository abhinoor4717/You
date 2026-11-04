'use client'

export default function Test() {

    const handleClick = async () => {
        const url = `/api/users?uuid=${encodeURIComponent("3f3a72e0-d7e6-11f1-9e0b-9af2b0417756")}`

        try {
            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const body = await res.json();
            if (!res.ok) {
                console.error(body.error ?? "Something went wrong");
            }

            return;
        } catch (error) {
            console.error("An error occurred", error);
        }
    }

    return (
        <div>
            <button onClick={handleClick}>Delete Donald</button>
        </div>
    )
}