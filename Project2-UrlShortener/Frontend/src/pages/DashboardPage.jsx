import { useDispatch } from "react-redux";
import { useLogoutMutation } from "../features/auth/authApi";
import UrlForm from "../components/UrlForm";
import UrlList from "../components/UrlList";
import { clearCredentials } from "../features/auth/authSlice";

export default function DashboardPage () {
    const dispatch = useDispatch();
    const [logout] = useLogoutMutation();

    async function handleLogout () {
        try {
            await logout().unwrap()
        } finally {
            dispatch(clearCredentials());
        }
    }

    return (
        <div className="container mt-5" style={{ maxWidth: "700px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3">Your Short URLs</h1>
                <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Logout</button>
            </div>
            <UrlForm />
            <UrlList />
        </div>
    )
}