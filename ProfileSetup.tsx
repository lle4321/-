import { useRef, useState } from "react";
import { Camera, Check, Heart, Users, UserRound } from "lucide-react";

export const PROFILE_STORAGE_KEY = "foundphone-riize-profile-v1";
const MEMBERS = [
  { id: "shotaro", name: "Shotaro", ko: "쇼타로" },
  { id: "eunseok", name: "Eunseok", ko: "은석" },
  { id: "sungchan", name: "Sungchan", ko: "성찬" },
  { id: "wonbin", name: "Wonbin", ko: "원빈" },
  { id: "sohee", name: "Sohee", ko: "소희" },
  { id: "anton", name: "Anton", ko: "앤톤" },
] as const;

export type PlayerProfile = {
  nickname: string;
  birthday: string;
  avatar: string;
  brothers: string[];
  boyfriend: string;
};

export function readSavedProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PlayerProfile;
    if (
      typeof value.nickname === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.birthday) &&
      Array.isArray(value.brothers) &&
      typeof value.boyfriend === "string"
    ) return value;
  } catch {
    // A damaged or unavailable local save should return to setup.
  }
  return null;
}

export function ProfileSetup({ onComplete }: { onComplete: (profile: PlayerProfile) => void }) {
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState("");
  const [brothers, setBrothers] = useState<string[]>(["shotaro", "eunseok", "sungchan", "wonbin", "sohee", "anton"]);
  const [boyfriend, setBoyfriend] = useState("wonbin");
  const [error, setError] = useState("");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const toggleBrother = (id: string) => {
    setBrothers((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件。");
      return;
    }
    setSavingPhoto(true);
    setError("");
    const reader = new FileReader();
    reader.onerror = () => {
      setSavingPhoto(false);
      setError("照片读取失败，请重新选择。");
    };
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => {
        setSavingPhoto(false);
        setError("无法读取这张照片，请换一张图片。");
      };
      image.onload = () => {
        const maxSide = 480;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          setSavingPhoto(false);
          setError("当前浏览器无法处理这张照片。");
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setAvatar(canvas.toDataURL("image/jpeg", 0.82));
        setSavingPhoto(false);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const cleanName = nickname.trim();
    if (!cleanName) return setError("先填写你的昵称。");
    if (!birthday) return setError("请选择完整的出生日期。");
    const [year, month, day] = birthday.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (
      !year || parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 || parsed.getDate() !== day
    ) {
      return setError("出生日期无效，请重新选择。");
    }
    if (!brothers.length) return setError("至少选择一位哥哥。");
    if (!boyfriend) return setError("请选择一位男友。");
    const profile = { nickname: cleanName, birthday, avatar, brothers, boyfriend };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      return setError("资料保存失败。请换一张较小的头像后重试。");
    }
    onComplete(profile);
  };

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-card">
        <div className="profile-setup-kicker">YOUR PHONE · YOUR STORY</div>
        <div className="profile-setup-mark"><Heart size={22} fill="currentColor" /></div>
        <h1>先认识一下你</h1>
        <p className="profile-setup-intro">完成个人资料，开启你的专属手机世界。</p>

        <div className="profile-avatar-area">
          <button className="profile-avatar-button" type="button" onClick={() => fileRef.current?.click()} aria-label="选择头像">
            {avatar ? <img src={avatar} alt="你选择的头像" /> : <span><UserRound size={34} /></span>}
            <i><Camera size={15} /></i>
          </button>
          <strong>{nickname.trim() || "你的昵称"}</strong>
          <small>{savingPhoto ? "正在处理照片…" : "点击头像，从相册选择照片"}</small>
          <input ref={fileRef} className="profile-file-input" type="file" accept="image/*" onChange={(e) => choosePhoto(e.target.files?.[0])} />
        </div>

        <div className="profile-field">
          <label htmlFor="profile-nickname">你的昵称</label>
          <input id="profile-nickname" value={nickname} maxLength={30} placeholder="输入昵称" autoComplete="nickname" onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div className="profile-field">
          <label htmlFor="profile-birthday">出生日期</label>
          <input id="profile-birthday" type="date" value={birthday} max={today} onChange={(e) => setBirthday(e.target.value)} />
          <small>生日的月日将作为手机锁屏密码（MMDD）。</small>
        </div>

        <div className="profile-section-heading"><Users size={18} /><div><strong>谁是你的哥哥？</strong><small>可多选，也可以六位都选</small></div></div>
        <div className="profile-member-grid">
          {MEMBERS.map((member) => {
            const selected = brothers.includes(member.id);
            return <button type="button" key={member.id} className={`profile-member ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => toggleBrother(member.id)}>
              <span className="profile-member-check">{selected && <Check size={13} />}</span>
              <strong>{member.name}</strong><small>{member.ko}</small>
            </button>;
          })}
        </div>

        <div className="profile-section-heading"><Heart size={18} /><div><strong>谁是你的男友？</strong><small>只能选择一位</small></div></div>
        <div className="profile-boyfriend-list">
          {MEMBERS.map((member) => <label key={member.id} className={`profile-boyfriend ${boyfriend === member.id ? "selected" : ""}`}>
            <input type="radio" name="profile-boyfriend" value={member.id} checked={boyfriend === member.id} onChange={() => setBoyfriend(member.id)} />
            <span><strong>{member.name}</strong><small>{member.ko}</small></span>
            <i>{boyfriend === member.id ? <Check size={15} /> : null}</i>
          </label>)}
        </div>

        {error && <p className="profile-error" role="alert">{error}</p>}
        <button type="button" className="profile-start-button" onClick={submit} disabled={savingPhoto}>完成设置，进入手机 <span>→</span></button>
        <p className="profile-privacy-note">资料和头像仅保存在当前浏览器中，不会自动上传。</p>
      </section>
    </main>
  );
}
