import { Link, useParams } from "react-router-dom";
import { useGetUrlStatsQuery } from "../features/urls/urlApi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import Loader from "../components/Loader";


export default function StatsPage () {

    const { slug } = useParams();
    const { data, isLoading, error} = useGetUrlStatsQuery(slug);

    if (isLoading) return <Loader />
    if (error) return <p className="container mt-5 text-danger">Failed to load stats.</p>;
    
    const { stats } = data;

    return (
        <div className="container mt-5" style={{ maxWidth: "700px" }}>
            <Link to="/" className="btn btn-outline-light btn-sm mb-3">← Back</Link>
            <h1 className="h3">/{stats.shortcode}</h1>
            <p className="text-muted text-truncate">{stats.originalurl}</p>
            <p>Total clicks: <strong>{stats.totalClicks}</strong></p>

            <h2 className="h5 mt-4">Clicks per day</h2>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.dailyClicks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0dcaf0" />
                </LineChart>
            </ResponsiveContainer>

            <h2 className="h5 mt-4">Traffic sources</h2>
            <table className="table table-dark table-sm">
                <thead>
                    <tr><th>Referrer</th><th>Clicks</th></tr>
                </thead>
                <tbody>
                    {stats.trafficSources.map((s) => (
                        <tr key={s.referrer || "direct"}>
                            <td>{s.referrer || "Direct"}</td>
                            <td>{s.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}