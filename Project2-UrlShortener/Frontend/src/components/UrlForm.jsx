import { useState } from "react";
import { toast } from "react-hot-toast";

import { useCreateUrlMutation } from "../features/urls/urlApi";

export default function UrlForm() {

    const [originalurl, setoriginalurl] = useState("");
    const [customslug, setcustomslug] = useState("");
    const [createUrl, { isLoading}] = useCreateUrlMutation();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await createUrl({ originalurl, customslug: customslug || undefined}).unwrap();
            toast.success("Short URL created");
            setoriginalurl("");
            setcustomslug("");
        } catch (err) {
            toast.error(err.data?.message || "Something went wrong");
        }
    }


    return (
        <form onSubmit={handleSubmit} className="card card-body bg-dark mb-4">
            <div className="mb-3">
                <label className="form-label">Long URL</label>
                <input
                    type="url"
                    required
                    placeholder="https://your-long-url.com"
                    value={originalurl}
                    onChange={(e) => setoriginalurl(e.target.value)}
                    className="form-control"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Custom slug (optional)</label>
                <input
                    type="text"
                    placeholder="my-link"
                    value={customslug}
                    onChange={(e) => setcustomslug(e.target.value)}
                    className="form-control"
                />
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
                {isLoading ? "Creating..." : "Shorten"}
            </button>
        </form>
    )
}