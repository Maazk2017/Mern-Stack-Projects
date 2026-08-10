import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetMyUrlsQuery, useDeleteUrlMutation } from "../features/urls/urlApi";
import Loader from "./Loader";

export default function UrlList() {

    const { data, isLoading } = useGetMyUrlsQuery();
    const [deleteUrl] = useDeleteUrlMutation();

    async function handleDelete(shortcode) {
        try {
            await deleteUrl(shortcode).unwrap();
            toast.success("Deleted");
        } catch {
            toast.error("Failed to delete");
        }
    }

    if (isLoading) return <Loader />
    if (!data?.urls?.length) return <p className="text-muted">No URLs yet.</p>;

    return (
        <table className="table table-dark table-hover align-middle">
            <thead>
                <tr>
                    <th>Short URL</th>
                    <th>Original</th>
                    <th>Clicks</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {data.urls.map((u) => (
                    <tr key={u._id}>
                        <td>
                            <a href={`http://localhost:8000/${u.shortcode}`} target="_blank" rel="noreferrer">
                                /{u.shortcode}
                            </a>
                        </td>
                        <td className="text-truncate" style={{ maxWidth: "220px" }}>{u.originalurl}</td>
                        <td>{u.clicks}</td>
                        <td className="d-flex gap-2">
                            <Link to={`/stats/${u.shortcode}`} className="btn btn-sm btn-outline-info">Stats</Link>
                            <button onClick={() => handleDelete(u.shortcode)} className="btn btn-sm btn-outline-danger">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}