export function isTWA(window, document) {
    const key = "is_twa_session";

    if (sessionStorage.getItem(key) === "1") {
        return true;
    }

    const fromReferrer = document.referrer.startsWith("android-app://");

    if (fromReferrer) {
        sessionStorage.setItem(key, "1");
        return true;
    }

    return false;
}
