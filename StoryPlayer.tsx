import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Phone } from "../Phone";
import { ProfileSetup, readSavedProfile, type PlayerProfile } from "./ProfileSetup";
import { validateWork, type Work } from "../schema";
import "../styles.css";
import "./player.css";
function StoryPlayer() {
  const [work, setWork] = useState<Work | null>(null),
    [error, setError] = useState("");
  const [profile, setProfile] = useState<PlayerProfile | null>(() => readSavedProfile());
  useEffect(() => {
    const abort = new AbortController();
    fetch(
      new URLSearchParams(location.search).get("preview") === "test"
        ? "./test-work.json"
        : new URLSearchParams(location.search).get("template") === "blank"
          ? "./blank-work.json"
          : "./work.json",
      { signal: abort.signal },
    )
      .then((r) => {
        if (!r.ok) throw Error("缺少作品文件，请运行 npm run story:build");
        return r.json();
      })
      .then((x) => {
        const w = validateWork(x);
        document.title =
          w.title === "捡手机" ? "捡手机" : w.title + " · 捡手机";
        setWork(w);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e));
      });
    return () => abort.abort();
  }, []);
  const birthdayPasscode = profile
    ? profile.birthday.slice(5, 7) + profile.birthday.slice(8, 10)
    : "";
  const playerWork = work && profile
    ? {
        ...work,
        phone: { ...work.phone, owner: profile.nickname, passcode: birthdayPasscode },
        variables: {
          ...work.variables,
          playerNickname: profile.nickname,
          playerBirthday: profile.birthday,
          playerAvatar: profile.avatar,
          riizeBrothers: profile.brothers.join(","),
          riizeBoyfriend: profile.boyfriend,
        },
      }
    : work;
  return (
    <main className="story-runtime">
      {!profile ? (
        <ProfileSetup onComplete={setProfile} />
      ) : playerWork ? (
        <Phone work={playerWork} />
      ) : (
        <p role="status">{error || "正在打开手机…"}</p>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<StoryPlayer />);
