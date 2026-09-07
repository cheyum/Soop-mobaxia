"use client";

import { useEffect, useState } from "react";

type LiveStatus = {
  live: boolean;
  error?: boolean;
};

const freePosts = [
  "모바샤 오늘 방송 너무 재밌었어요 💗",
  "팬아트 올려도 되나요?",
  "다음 합방 일정 기다리는중!",
  "굿즈 나오면 사고 싶어요 🌸",
];

const notices = [
  "[공지] 방송 일정은 캘린더 참고 부탁드려요",
  "[공지] 방송국 규칙을 확인해주세요",
  "[공지] 이벤트 참여 방법 안내",
  "[공지] 배너 및 팬아트 제보 환영 ♡",
];

export default function Home() {
  const [status, setStatus] = useState<LiveStatus>({
    live: false,
    error: false,
  });

  const [loading, setLoading] = useState(true);

  async function checkLive() {
    try {
      const response = await fetch("/api/live/mobaxia", {
        cache: "no-store",
      });

      const text = await response.text();

      if (!response.ok || !text.trim()) {
        setStatus({
          live: false,
          error: true,
        });

        setLoading(false);
        return;
      }

      const data = JSON.parse(text);

      setStatus({
        live: Boolean(data.live),
        error: Boolean(data.error),
      });
    } catch (error) {
      console.error("방송 상태 확인 실패:", error);

      setStatus({
        live: false,
        error: true,
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    checkLive();

    // 1분마다 방송 상태 갱신
    const timer = setInterval(() => {
      checkLive();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="page">
      {/* 배경 장식 */}
      <div className="bgHeart bgHeart1">♡</div>
      <div className="bgHeart bgHeart2">♡</div>

      <div className="bgStar bgStar1">✦</div>
      <div className="bgStar bgStar2">✦</div>

      {/* =========================
          HEADER
      ========================== */}
      <header className="header">
        <div className="brand">
          <div className="brandIcon">♥</div>

          <div>
            <h1>MOBASHA</h1>
            <p>SOOP VIRTUAL STREAMER</p>
          </div>
        </div>

        <div className="topStatus">
          {loading ? (
            <>
              <span className="statusDot loadingDot" />
              방송 상태 확인 중
            </>
          ) : status.error ? (
            <>
              <span className="statusDot errorDot" />
              상태 확인 중
            </>
          ) : status.live ? (
            <>
              <span className="statusDot liveDot" />
              바샤좀 놀아줘!
            </>
          ) : (
            <>
              <span className="statusDot offlineDot" />
              바샤는 쉬는중
            </>
          )}
        </div>
      </header>

      {/* =========================
          메인 프로필 카드
      ========================== */}
      <section className="profileCard">
        {/* =========================
            왼쪽 - 방송화면
        ========================== */}
        <div className="profileMain">
          <div className="welcomeTag">
            ♡ 모셔 서면엔 청설모 모셔 모바샤 🐿 ♡
          </div>

          {/* 방송 화면 */}
          <div
            className={`streamScreen ${
              status.live ? "streamOnline" : "streamOffline"
            }`}
          >
            {loading ? (
              <div className="streamPlaceholder">
                <span className="loadingStreamDot" />

                <strong>CHECKING</strong>

                <p>방송 상태를 확인하고 있어요</p>
              </div>
            ) : status.error ? (
              <div className="streamPlaceholder offlineScreen">
                <span className="offlineHeart">♡</span>

                <strong>CHECKING</strong>

                <p>방송 상태를 확인하고 있어요</p>
              </div>
            ) : status.live ? (
              <iframe
                src="https://play.sooplive.com/mobaxia/embed"
                title="모바샤 SOOP LIVE"
                className="soopPlayer"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="streamPlaceholder offlineScreen">
                <span className="offlineHeart">♡</span>

                <strong>OFFLINE</strong>

                <p>지금은 방송을 쉬고 있어요</p>
              </div>
            )}
          </div>

          {/* 프로필 + 닉네임 */}
          <div className="identityRow">
            <div
              className={`smallProfileRing ${
                status.live ? "smallProfileLive" : ""
              }`}
            >
              <ProfileImage />
            </div>

            <div className="identityText">
              <div className="identityName">
                <h2>모바샤</h2>

                {status.live && !loading && !status.error && (
                  <span className="identityLiveBadge">
                    LIVE
                  </span>
                )}
              </div>

              <div className="basicInfo">
                생일 · 8월25일

                <span>/</span>

                언제나 24살

                <span>/</span>

                감성파 ESTJ
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            오른쪽 - 일정 및 링크
        ========================== */}
        <div className="profileDetails">
          <div className="scheduleBox">
            <strong>
              🌸 상시 스케줄은 캘린더 참고 🌸
            </strong>

            <p>
              매주 월~금 오후 6시
              <br className="mobileBreak" />

              <span className="pcDivider">
                {" "}·{" "}
              </span>

              토~일 오후 11시

              <br />

              (주1회 휴방) 바샤 등장(˶ᵔ ᵕ ᵔ˶)♥
            </p>
          </div>

          <a
            href="https://www.sooplive.com/station/mobaxia"
            target="_blank"
            rel="noopener noreferrer"
            className={`soopButton ${
              status.live ? "soopButtonLive" : ""
            }`}
          >
            <span>♥</span>

            {status.live
              ? "지금 모바샤 방송 보러가기"
              : "모바샤 방송국 놀러가기"}

            <span className="buttonArrow">
              →
            </span>
          </a>

          <div className="happyMessage">
            ✦ 오늘도 모바샤와 함께 행복한 하루 ✦
          </div>
        </div>
      </section>

      {/* =========================
          하단 콘텐츠
      ========================== */}
      <section className="contentGrid">
        {/* 자유게시판 */}
        <article className="contentCard">
          <div className="cardTitle">
            <h3>자유게시판</h3>
            <span>Free Board</span>
          </div>

          <div className="postList">
            {freePosts.map((post, index) => (
              <a
                href="#"
                className="postItem"
                key={`free-${index}`}
              >
                {post}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="cardButton"
          >
            게시판 바로가기
          </button>
        </article>

        {/* 공지사항 */}
        <article className="contentCard">
          <div className="cardTitle">
            <h3>공지사항</h3>
            <span>Notice</span>
          </div>

          <div className="postList">
            {notices.map((notice, index) => (
              <a
                href="#"
                className="postItem noticeItem"
                key={`notice-${index}`}
              >
                {notice}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="cardButton"
          >
            공지 전체보기
          </button>
        </article>

        {/* 배너 */}
        <article className="contentCard">
          <div className="cardTitle">
            <h3>배너</h3>
            <span>Banner</span>
          </div>

          <a
            href="https://www.sooplive.com/station/mobaxia"
            target="_blank"
            rel="noopener noreferrer"
            className="mainBanner"
          >
            <span className="bannerSmall">
              MOBASHA
            </span>

            <strong>
              모바샤 방송국
            </strong>

            <p>
              방송 보러가기 · 소식 확인하기
            </p>

            <span className="bannerHeart">
              ♡
            </span>
          </a>

          <a
            href="#"
            className="subBanner"
          >
            팬카페 / BNB / 일정표 배너 영역
          </a>
        </article>
      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="footer">
        ♡ &nbsp; MOBASHA FAN PAGE &nbsp; ♡
      </footer>
    </main>
  );
}

/* =================================
   SOOP 프로필 이미지 자동 연동
================================= */

function ProfileImage() {
  const streamerId = "mobaxia";

  const prefix =
    streamerId.slice(0, 2).toLowerCase();

  const sources = [
    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.webp`,

    `https://profile.img.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.webp`,
  ];

  const [index, setIndex] =
    useState(0);

  const [failed, setFailed] =
    useState(false);

  function handleError() {
    if (index + 1 < sources.length) {
      setIndex(index + 1);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div className="profileFallback">
        모
      </div>
    );
  }

  return (
    <img
      src={sources[index]}
      alt="모바샤 프로필"
      className="profileImage"
      onError={handleError}
    />
  );
}