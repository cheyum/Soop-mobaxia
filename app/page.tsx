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

  schedulePosts?: SoopPost[];
  schedulePostsError?: boolean;
  schedulePostsMessage?: string;
};

/* =========================================
   게시판 링크
========================================= */

const UP_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110231";

const SCHEDULE_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110021";

/* =========================================
   업보현황
========================================= */

const ROULETTE_URL =
  "https://weflab.com/user/lOPU2suSk2lqZW0";

function makePostSlots(
  posts: SoopPost[],
  count = 3
) {
  return Array.from(
    { length: count },
    (_, index) => posts[index] ?? null
  );
}

  export default function Home() {
  /* =========================================
     LIVE 상태
  ========================================= */

  const [status, setStatus] =
    useState<LiveStatus>({
      live: false,
      error: false,
    });

  const [loading, setLoading] =
    useState(true);

  /* =========================================
     바샤업up
  ========================================= */

  const [upPosts, setUpPosts] =
    useState<SoopPost[]>([]);

  const [postsError, setPostsError] =
    useState<string | null>(null);

  /* =========================================
     일정 안내
  ========================================= */

  const [
    schedulePosts,
    setSchedulePosts,
  ] = useState<SoopPost[]>([]);

  const [
    scheduleError,
    setScheduleError,
  ] = useState<string | null>(null);

  const [
    postsLoading,
    setPostsLoading,
  ] = useState(true);

  /* =========================================
     SOOP 데이터 새로고침
  ========================================= */

  async function refreshMobaxia() {
    try {
      const response =
        await fetch(
          "/api/live/mobaxia",
          {
            cache: "no-store",
          }
        );

      const text =
        await response.text();

      if (
        !response.ok ||
        !text.trim()
      ) {
        setStatus({
          live: false,
          error: true,
        });

        setUpPosts([]);
        setSchedulePosts([]);

        setPostsError(
          "게시글을 불러오지 못했어요"
        );

        setScheduleError(
          "일정을 불러오지 못했어요"
        );

        return;
      }

      const data =
        JSON.parse(
          text
        ) as MobaxiaApiResponse;

      /* =========================
         LIVE
      ========================== */

      setStatus({
        live:
          Boolean(
            data.live
          ),

        error:
          Boolean(
            data.liveError
          ),
      });

      /* =========================
         바샤업up
      ========================== */

      if (
        Array.isArray(
          data.posts
        )
      ) {
        setUpPosts(
          data.posts.slice(
            0,
            3
          )
        );
      } else {
        setUpPosts([]);
      }

      if (
        data.postsError
      ) {
        setPostsError(
          data.postsMessage ||
            "게시글을 불러오지 못했어요"
        );
      } else {
        setPostsError(null);
      }

      /* =========================
         일정 안내
      ========================== */

      if (
        Array.isArray(
          data.schedulePosts
        )
      ) {
        setSchedulePosts(
          data.schedulePosts.slice(
            0,
            3
          )
        );
      } else {
        setSchedulePosts([]);
      }

      if (
        data.schedulePostsError
      ) {
        setScheduleError(
          data.schedulePostsMessage ||
            "일정을 불러오지 못했어요"
        );
      } else {
        setScheduleError(null);
      }
    } catch (error) {
      console.error(
        "MOBAXIA 정보 조회 실패:",
        error
      );

      setStatus({
        live: false,
        error: true,
      });

      setUpPosts([]);
      setSchedulePosts([]);

      setPostsError(
        "게시글을 불러오지 못했어요"
      );

      setScheduleError(
        "일정을 불러오지 못했어요"
      );
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  }

  /* =========================================
     30초 자동 갱신
  ========================================= */

  useEffect(() => {
    refreshMobaxia();

    const timer =
      setInterval(() => {
        refreshMobaxia();
      }, 30000);

    return () =>
      clearInterval(
        timer
      );
  }, []);

  return (
    <main className="page">
      {/* 배경 장식 */}

      <div className="bgHeart bgHeart1">
        ♡
      </div>

      <div className="bgHeart bgHeart2">
        ♡
      </div>

      <div className="bgStar bgStar1">
        ✦
      </div>

      <div className="bgStar bgStar2">
        ✦
      </div>
      <div className="siteMascot siteMascotLeft" aria-hidden="true">
  <img
    src="/mobaxia-character.png"
    alt=""
    className="siteMascotImage"
  />
</div>

<div className="siteMascot siteMascotRight" aria-hidden="true">
  <img
    src="/mobaxia-character.png"
    alt=""
    className="siteMascotImage"
  />
</div>

      {/* =================================
          HEADER
      ================================= */}

      <header className="header">
        <div className="brand">
          <div className="brandIcon">
            ♥
          </div>

          <div>
            <h1>
              MOBAXIA
            </h1>

            <p>
              SOOP VIRTUAL STREAMER
            </p>
          </div>
        </div>

        <div className="topStatus">
          {loading ? (
            <>
              <span
                className="statusDot loadingDot"
              />

              방송 상태 확인 중
            </>
          ) : status.error ? (
            <>
              <span
                className="statusDot errorDot"
              />

              상태 확인 중
            </>
          ) : status.live ? (
            <>
              <span
                className="statusDot liveDot"
              />

              바샤좀 놀아줘!
            </>
          ) : (
            <>
              <span
                className="statusDot offlineDot"
              />

              바샤는 쉬는중
            </>
          )}
        </div>
      </header>

      {/* =================================
          메인 프로필
      ================================= */}

      <section className="profileCard">
        <div className="profileCharacterDeco" aria-hidden="true">
  <img
    src="/mobaxia-character.png"
    alt=""
    className="profileCharacterImage"
  />
</div>
        {/* =================================
            왼쪽 방송화면
        ================================= */}

        <div className="profileMain">
          <div className="welcomeTag">
            ♡ S급 서민영애 청설모 모씨 모바샤🐿️ ♡
          </div>

          <div
            className={`streamScreen ${
              status.live
                ? "streamOnline"
                : "streamOffline"
            }`}
          >
            {loading ? (
              <div className="streamPlaceholder">
                <span className="loadingStreamDot" />

                <strong>
                  CHECKING
                </strong>

                <p>
                  방송 상태를 확인하고 있어요
                </p>
              </div>
            ) : status.error ? (
              <div className="streamPlaceholder offlineScreen">
                <span className="offlineHeart">
                  ♡
                </span>

                <strong>
                  CHECKING
                </strong>

                <p>
                  방송 상태를 확인하고 있어요
                </p>
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
                <span className="offlineHeart">
                  ♡
                </span>

                <strong>
                  OFFLINE
                </strong>

                <p>
                  지금은 방송을 쉬고 있어요
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =================================
            오른쪽 정보
        ================================= */}

        <div className="profileDetails">
          <div className="identityRow">
            <div
              className={`smallProfileRing ${
                status.live
                  ? "smallProfileLive"
                  : ""
              }`}
            >
              <ProfileImage />
            </div>

            <div className="identityText">
              <div className="identityName">
                <h2>
                  모바샤
                </h2>

                {status.live &&
                  !loading &&
                  !status.error && (
                    <span className="identityLiveBadge">
                      LIVE
                    </span>
                  )}
              </div>

              <div className="basicInfo">
                생일 · 8월25일

                <span>
                  /
                </span>

                언제나 24살

                <span>
                  /
                </span>

                감성파 ESTJ
              </div>
            </div>
          </div>

          {/* =================================
              상시 스케줄
          ================================= */}

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

            <div className="scheduleMessage">
              ✦ 오늘도 모바샤와 함께 행복한 하루 ✦
            </div>
          </div>

          {/* =================================
              링크 버튼
          ================================= */}

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

      {/* =================================
          하단 콘텐츠
      ================================= */}

      <section className="contentGrid">
       {/* =================================
    바샤업up
================================= */}

<article className="contentCard boardCard">
  <div className="cardTitle">
    <h3>
      바샤업up
    </h3>

    <span>
      BASHA UP
    </span>
  </div>

  <div className="postList fixedPostList">
    {postsLoading ? (
      <>
        <div className="postItem">
          최신 글을 불러오는 중이에요 ♡
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>


      </>
    ) : postsError ? (
      <>
        <div
          className="postItem"
          title={postsError}
        >
          게시글을 불러오지 못했어요
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>


      </>
    ) : (
      makePostSlots(
        upPosts
      ).map(
        (post, index) =>
          post ? (
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
          ) : (
            <div
              className="postItem emptyPostItem"
              key={`up-empty-${index}`}
            >
              &nbsp;
            </div>
          )
      )
    )}
  </div>

  <button
    type="button"
    className="cardButton"
    onClick={() => {
      window.open(
        UP_BOARD_URL,
        "_blank",
        "noopener,noreferrer"
      );
    }}
  >
    바샤업up 전체보기
  </button>
</article>

        {/* =================================
    일정 안내
================================= */}

<article className="contentCard boardCard">
  <div className="cardTitle">
    <h3>
      일정 안내
    </h3>

    <span>
      Schedule
    </span>
  </div>

  <div className="postList fixedPostList">
    {postsLoading ? (
      <>
        <div className="postItem">
          최신 일정을 불러오는 중이에요 ♡
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>
      </>
    ) : scheduleError ? (
      <>
        <div
          className="postItem"
          title={scheduleError}
        >
          일정을 불러오지 못했어요
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>

        <div className="postItem emptyPostItem">
          &nbsp;
        </div>
      </>
    ) : (
      makePostSlots(
        schedulePosts
      ).map(
        (post, index) =>
          post ? (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="postItem noticeItem"
              key={post.id}
              title={post.title}
            >
              {post.title}
            </a>
          ) : (
            <div
              className="postItem emptyPostItem"
              key={`schedule-empty-${index}`}
            >
              &nbsp;
            </div>
          )
      )
    )}
  </div>

  <button
    type="button"
    className="cardButton"
    onClick={() => {
      window.open(
        SCHEDULE_BOARD_URL,
        "_blank",
        "noopener,noreferrer"
      );
    }}
  >
    일정 전체보기
  </button>
</article>

        {/* =================================
            업보현황
        ================================= */}

        <article className="contentCard">
          <div className="cardTitle">
            <h3>
              업보현황
            </h3>

            <span>
              Roulette
            </span>
          </div>

          <div className="upboList">
            {/* =========================
                1줄
                룰렛확률
            ========================== */}

            <a
              href={ROULETTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="upboRow upboLink"
            >
              <strong>
                룰렛확률
              </strong>

              <span>
                바로가기 ›
              </span>
            </a>

            {/* =========================
                2줄
                엑셀표 - 추후 연결
            ========================== */}

            <div
              className="
                upboRow
                upboLink
                upboDisabled
              "
            >
              <strong>
                룰렛 결과 엑셀표
              </strong>

              <span>
                준비중
              </span>
            </div>

            {/* =========================
                3줄
                검색 - 추후 활성화
            ========================== */}

            <div className="upboRow upboSearchRow">
              <input
                type="text"
                className="upboSearchInput"
                placeholder="엑셀 연결 후 검색 가능"
                aria-label="업보현황 검색"
                disabled
              />

              <button
                type="button"
                className="upboSearchButton"
                disabled
              >
                검색
              </button>
            </div>

            {/* =========================
                4줄
                검색 결과
            ========================== */}

            <div className="upboRow upboResultRow">
              <span className="upboEmpty">
                엑셀 연결 후 검색 결과가 표시됩니다 ♡
              </span>
            </div>
          </div>
        </article>
      </section>

      {/* =================================
          FOOTER
      ================================= */}

      <footer className="footer">
        ♡ &nbsp; MOBAXIA FAN PAGE &nbsp; ♡
      </footer>
    </main>
  );
}

/* =========================================
   SOOP 프로필 이미지 자동 연동
========================================= */

function ProfileImage() {
  const streamerId =
    "mobaxia";

  const prefix =
    streamerId
      .slice(0, 2)
      .toLowerCase();

  const sources = [
    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.webp`,

    `https://profile.img.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.webp`,
  ];

  const [
    index,
    setIndex,
  ] =
    useState(0);

  const [
    failed,
    setFailed,
  ] =
    useState(false);

  function handleError() {
    if (
      index + 1 <
      sources.length
    ) {
      setIndex(
        index + 1
      );
    } else {
      setFailed(
        true
      );
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
/* ==========================================
   MOBAXIA 캐릭터 테마
========================================== */

:root {
  --mobaxia-brown: #a75f61;
  --mobaxia-dark: #4d3540;
  --mobaxia-soft-pink: #ffd9e6;
  --mobaxia-pink: #ffb7cf;
  --mobaxia-cream: #fffafc;
  --mobaxia-sky: #8fd8ef;
  --mobaxia-deep-sky: #245a70;
  --mobaxia-line: rgba(214, 193, 201, 0.42);
}

/* 전체 배경을 캐릭터 시트 느낌의 격자로 */
body {
  background:
    linear-gradient(var(--mobaxia-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--mobaxia-line) 1px, transparent 1px),
    radial-gradient(
      circle at 12% 10%,
      rgba(255, 204, 223, 0.38),
      transparent 28%
    ),
    radial-gradient(
      circle at 88% 18%,
      rgba(143, 216, 239, 0.18),
      transparent 25%
    ),
    linear-gradient(
      135deg,
      #fffafc 0%,
      #fff1f6 55%,
      #fffdfd 100%
    );

  background-size:
    26px 26px,
    26px 26px,
    auto,
    auto,
    auto;
}

/* 기존 배경 장식은 약하게 */
.bgHeart,
.bgStar {
  opacity: 0.12;
}


/* ==========================================
   캐릭터 배경 장식
========================================== */

.siteMascot {
  position: fixed;

  z-index: 1;

  pointer-events: none;
  user-select: none;

  opacity: 0.16;
}

.siteMascotLeft {
  left: 18px;
  bottom: 34px;

  width: 170px;

  transform: rotate(-6deg);
}

.siteMascotRight {
  right: 22px;
  top: 120px;

  width: 180px;

  transform: rotate(6deg);
}

.siteMascotImage {
  display: block;
  width: 100%;
  height: auto;

  filter: drop-shadow(
    0 12px 24px rgba(120, 83, 99, 0.12)
  );
}


/* ==========================================
   메인 카드 안 캐릭터 워터마크
========================================== */

.profileCard {
  overflow: hidden;
}

.profileCharacterDeco {
  position: absolute;

  right: 18px;
  bottom: 8px;

  width: 210px;

  z-index: 1;

  opacity: 0.12;

  pointer-events: none;
}

.profileCharacterImage {
  display: block;
  width: 100%;
  height: auto;
}

/* 실제 내용은 장식보다 위 */
.profileMain,
.profileDetails {
  position: relative;
  z-index: 2;
}


/* ==========================================
   메인 카드 / 하단 카드 색감
========================================== */

.profileCard {
  background:
    rgba(255, 255, 255, 0.87);

  border:
    1px solid
    rgba(242, 184, 206, 0.85);

  box-shadow:
    0 26px 60px rgba(197, 130, 157, 0.12);
}

.contentCard {
  position: relative;
  overflow: hidden;

  background:
    rgba(255, 255, 255, 0.88);

  border:
    1px solid
    rgba(244, 195, 214, 0.82);

  box-shadow:
    0 14px 35px rgba(201, 140, 165, 0.08);
}

/* 카드에 은은한 포인트 */
.contentCard::before {
  content: "";

  position: absolute;

  top: 12px;
  right: 14px;

  width: 64px;
  height: 64px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle at 40% 40%,
      rgba(143, 216, 239, 0.28),
      transparent 62%
    );

  pointer-events: none;
}


/* ==========================================
   헤더 / 태그 / 상태
========================================== */

.brandIcon {
  background:
    linear-gradient(
      135deg,
      #ff93bb,
      #ff6ea7
    );
}

.brand h1 {
  color: var(--mobaxia-dark);
}

.brand p {
  color: #c78fa5;
}

.topStatus {
  background:
    rgba(255, 255, 255, 0.8);

  border:
    1px solid
    rgba(239, 183, 206, 0.8);

  color: #9d6a80;
}

.welcomeTag {
  background:
    linear-gradient(
      135deg,
      #fff3f7,
      #ffe8f1
    );

  color: #cd7f9f;

  box-shadow:
    0 6px 18px rgba(226, 148, 182, 0.12);
}


/* ==========================================
   방송화면 / 프로필 박스
========================================== */

.streamScreen {
  background:
    linear-gradient(
      180deg,
      #fff8fb 0%,
      #fff1f6 100%
    );

  border-color: #f1bfd3;
}

.streamOnline {
  border-color: #f39fc0;

  box-shadow:
    0 16px 40px rgba(255, 115, 170, 0.18);
}

.streamPlaceholder strong {
  color: #9a6c7f;
}

.streamPlaceholder p {
  color: #c895aa;
}

.scheduleBox {
  background:
    linear-gradient(
      135deg,
      #fff7fa 0%,
      #ffedf5 60%,
      #eefaff 100%
    );

  color: #93687a;
}

.scheduleBox strong {
  color: #8d6072;
}

.scheduleMessage {
  color: #c38ea4;
}


/* ==========================================
   제목 스타일
========================================== */

.cardTitle h3 {
  color: #5a3f49;
}

.cardTitle span {
  color: #cd97ae;

  letter-spacing: 1.2px;
}

/* 제목 아래 캐릭터 느낌 바 */
.cardTitle h3::after {
  content: "";

  display: block;

  width: 42px;
  height: 6px;

  margin: 10px auto 0;

  border-radius: 999px;

  background:
    linear-gradient(
      90deg,
      #ffbfd4 0%,
      #8fd8ef 55%,
      #245a70 100%
    );

  opacity: 0.9;
}


/* ==========================================
   게시글 / 업보현황 줄 스타일
========================================== */

.postItem,
.upboRow {
  background:
    rgba(255, 252, 253, 0.98);

  border-color:
    rgba(240, 201, 217, 0.95);

  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

a.postItem:hover,
a.upboLink:hover {
  background: #fff3f8;
}

.postItem {
  color: #835f6d;
}

.upboLink {
  color: #764858;
}

.upboResultRow {
  color: #755066;
}

.emptyPostItem:hover {
  background:
    rgba(255, 252, 253, 0.98);
  transform: none;
}


/* ==========================================
   버튼 / 링크 버튼
========================================== */

.cardButton {
  background:
    linear-gradient(
      135deg,
      #ffb5cf 0%,
      #ffd5e3 45%,
      #8fd8ef 100%
    );

  color: #553845;

  box-shadow:
    0 10px 22px rgba(210, 154, 180, 0.16);
}

.cardButton:hover {
  background:
    linear-gradient(
      135deg,
      #ffa9c8 0%,
      #ffcfe0 45%,
      #84d2ec 100%
    );
}

.homeButton {
  background:
    linear-gradient(
      135deg,
      #ff94bc 0%,
      #ff74a9 55%,
      #8fd8ef 100%
    );

  box-shadow:
    0 12px 28px rgba(233, 128, 173, 0.24);
}

.emptyLinkButton {
  background:
    rgba(255, 252, 253, 0.82);

  border:
    1px dashed
    #eab4ca;
}

.emptyLinkButton:hover {
  background: #fff4f8;
}


/* ==========================================
   업보현황 검색
========================================== */

.upboSearchInput {
  background: #ffffff;
  color: #6f4055;
}

.upboSearchInput::placeholder {
  color: #c79aac;
}

.upboSearchButton {
  background:
    linear-gradient(
      135deg,
      #f6adc9,
      #8fd8ef
    );

  color: #ffffff;
}


/* ==========================================
   푸터
========================================== */

.footer {
  color: #c997ac;

  letter-spacing: 2px;
}


/* ==========================================
   모바일
========================================== */

@media (max-width: 768px) {
  .siteMascot {
    display: none;
  }

  .profileCharacterDeco {
    width: 120px;

    right: 10px;
    bottom: 8px;

    opacity: 0.1;
  }

  .contentCard::before {
    width: 48px;
    height: 48px;

    top: 10px;
    right: 10px;
  }

  .cardTitle h3::after {
    width: 34px;
    height: 5px;

    margin-top: 8px;
  }
}