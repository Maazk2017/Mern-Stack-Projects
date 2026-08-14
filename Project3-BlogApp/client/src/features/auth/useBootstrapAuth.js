import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../api/axiosInstance";
import { setCredentials, clearCredentials, setBootstrapped  } from "./authSlice";

// The access token lives only in memory, so a full page reload wipes it —
// but the httpOnly refresh cookie may still be valid. On app mount, try a
// silent refresh; if it succeeds, fetch the user and consider them logged in.


export function useBootstrapAuth () {
    const dispatch = useDispatch();

    useEffect(() => {
        let cancelled = false;

        async function bootstrap () {
            try {
                const { data } = await axiosInstance.post("/auth/refresh");
                if (cancelled) return;
                dispatch(setCredentials({ accessToken: data.accessToken }));

                const me = await axiosInstance.get("/auth/getMe");
                if (!cancelled) {
                    dispatch(setCredentials({ user: me.data.user }));
                }

            } catch {
                if (!cancelled) dispatch(clearCredentials());
            } finally {
                if (!cancelled) dispatch(setBootstrapped());
            }
        }

        bootstrap();
        return () => {cancelled = true};

    }, [dispatch]);

}
