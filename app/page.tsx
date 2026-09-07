"use client";

import { useEffect, useState } from "react";

type LiveStatus = {
  live: boolean;
  error: boolean;
};

type SoopPost = {
  id: string;
  title: string;
  url: string;
  regDate?: string;
};

type MobaxiaApiResponse = {
  live?: boolean;
  liveError?: boolean;
  liveMessage?: string;
  posts?: SoopPost[];
  postsError?: boolean;
  postsMessage?: string;
};

const UP_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110231";

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
  const [upPosts, setUpPosts] = useState<SoopPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  async function refreshMobaxia() {
    try {
      const response = await fetch("/api/live/mobaxia", {
        cache: "no-store",
      });

      const text = await response.text();

      if (!response.ok || !text.trim()) {
        setStatus({ live: false, error: true });
        setUpPosts([]);
        setPostsError("게시글을 불러오지 못했어요");
        return;
      }

      const data = JSON.parse(text) as MobaxiaApiResponse;

      setStatus({
        live: Boolean(data.live),
        error: Boolean(data.liveError),
      });

      if (Array.isArray(data.posts)) {
        setUpPosts(data.posts.slice(0, 4));
      } else {
        setUpPosts([]);
      }

      if (data.postsError) {
        setPostsError(data.postsMessage || "게시글을 불러오지 못했어요");
      } else {
        setPostsError(null);
      }
    } catch (error) {
      console.error("MOBAXIA 정보 조회 실패:", error);
      setStatus({ live: false, error: true });
      setUpPosts([]);
      setPostsError("게시글을 불러오지 못했어요");
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  }

  useEffect(() => {
    refreshMobaxia();

    // 방송 상태 + UP해줘 게시글을 30초마다 갱신
    const timer = setInterval(() => {
      refreshMobaxia();
    }, 30000);

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
            <h1>MOBAXIA</h1>
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
            ♡ S급 서민영애 청설모 모씨 모바샤🐿️ ♡
          </div>

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
        </div>

        {/* =========================
            오른쪽 - 일정 및 링크
        ========================== */}
        <div className="profileDetails">
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
                  <span className="identityLiveBadge">LIVE</span>
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

          {/* 상시 스케줄 */}
          <div className="scheduleBox">
            <strong>🌸 상시 스케줄은 캘린더 참고 🌸</strong>

            <p>
              매주 월~금 오후 6시
              <br className="mobileBreak" />
              <span className="pcDivider"> · </span>
              토~일 오후 11시
              <br />
              (주1회 휴방) 바샤 등장(˶ᵔ ᵕ ᵔ˶)♥
            </p>

            <div className="scheduleMessage">
              ✦ 오늘도 모바샤와 함께 행복한 하루 ✦
            </div>
          </div>

          {/* 링크 버튼 4개 */}
          <div className="linkButtonRow">
            <a
              href="https://www.sooplive.com/station/mobaxia"
              target="_blank"
              rel="noopener noreferrer"
              className="squareLinkButton homeButton"
              aria-label="모바샤 방송국"
              title="모바샤 방송국"
            >
              <svg
                viewBox="0 0 24 24"
                className="linkIcon"
                aria-hidden="true"
              >
                <path
                  d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5v-9.7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            <div
              className="squareLinkButton emptyLinkButton"
              title="링크 추가 예정"
            />
            <div
              className="squareLinkButton emptyLinkButton"
              title="링크 추가 예정"
            />
            <div
              className="squareLinkButton emptyLinkButton"
              title="링크 추가 예정"
            />
          </div>
        </div>
      </section>

      {/* =========================
          하단 콘텐츠
      ========================== */}
      <section className="contentGrid">
        {/* UP해줘 */}
        <article className="contentCard">
          <div className="cardTitle">
            <h3>𓍢ִ໋ 🌿바샤업UP..</h3>
            <span>BASHA UP</span>
          </div>

          <div className="postList">
            {postsLoading ? (
              <div className="postItem">최신 글을 불러오는 중이에요 ♡</div>
            ) : postsError ? (
              <div className="postItem" title={postsError}>
                게시글을 불러오지 못했어요
              </div>
            ) : upPosts.length > 0 ? (
              upPosts.map((post) => (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="postItem"
                  key={post.id}
                  title={post.title}
                >
                  {post.title}
                </a>
              ))
            ) : (
              <div className="postItem">아직 등록된 글이 없어요 ♡</div>
            )}
          </div>

          <button
            type="button"
            className="cardButton"
            onClick={() => {
              window.open(UP_BOARD_URL, "_blank", "noopener,noreferrer");
            }}
          >
            𓍢ִ໋ 🌿바샤업UP.. 전체보기
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

          <button type="button" className="cardButton">
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
            <span className="bannerSmall">MOBAXIA</span>
            <strong>모바샤 방송국</strong>
            <p>방송 보러가기 · 소식 확인하기</p>
            <span className="bannerHeart">♡</span>
          </a>

          <a href="#" className="subBanner">
            팬카페 / BNB / 일정표 배너 영역
          </a>
        </article>
      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="footer">
        ♡ &nbsp; MOBAXIA FAN PAGE &nbsp; ♡
      </footer>
    </main>
  );
}

/* =================================
   SOOP 프로필 이미지 자동 연동
================================= */
function ProfileImage() {
  const streamerId = "mobaxia";
  const prefix = streamerId.slice(0, 2).toLowerCase();

  const sources = [
    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.webp`,
    `https://profile.img.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.jpg`,
    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.jpg`,
    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.webp`,
  ];

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  function handleError() {
    if (index + 1 < sources.length) {
      setIndex(index + 1);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return <div className="profileFallback">모</div>;
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
