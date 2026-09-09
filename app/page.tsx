"use client";

import { useEffect, useState } from "react";

/* =========================================
   타입
========================================= */

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
   업보현황 링크
========================================= */

const ROULETTE_URL =
  "https://weflab.com/user/lOPU2suSk2lqZW0";

/* =========================================
   게시글 3칸 고정
========================================= */

function makePostSlots(
  posts: SoopPost[],
  count = 3
) {
  return Array.from(
    { length: count },
    (_, index) => posts[index] ?? null
  );
}

/* =========================================
   메인 페이지
========================================= */

export default function Home() {
  /* =========================================
     LIVE
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
  ] =
    useState<SoopPost[]>([]);

  const [
    scheduleError,
    setScheduleError,
  ] =
    useState<string | null>(null);

  const [
    postsLoading,
    setPostsLoading,
  ] =
    useState(true);

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

      /* LIVE */

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

      /* 바샤업up */

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

      /* 일정 */

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
     30초 자동 업데이트
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

      {/* =================================
          기존 배경 장식
      ================================= */}

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

      {/* =================================
          배경 캐릭터 장식
      ================================= */}

      <div
        className="siteMascot siteMascotLeft"
        aria-hidden="true"
      >
        <img
          src="/mobaxia-character.png"
          alt=""
          className="siteMascotImage"
        />
      </div>

      <div
        className="siteMascot siteMascotRight"
        aria-hidden="true"
      >
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

        {/* 방송 상태 */}

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
          메인 카드
      ================================= */}

      <section className="profileCard">

        {/* 메인 카드 캐릭터 워터마크 */}

        <div
          className="profileCharacterDeco"
          aria-hidden="true"
        >
          <img
            src="/mobaxia-character.png"
            alt=""
            className="profileCharacterImage"
          />
        </div>

        {/* =================================
            방송 화면
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
            오른쪽 프로필
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

            캐릭터가 카드 위에 누운 느낌
        ================================= */}

        <article
          className="
            contentCard
            boardCard
            mascotBoardCard
            mascotBoardUp
          "
        >

          <div
            className="
              cardMascot
              cardMascotLie
            "
            aria-hidden="true"
          >
            <img
              src="/mobaxia-character.png"
              alt=""
              className="cardMascotImage"
            />
          </div>

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

            캐릭터가 오른쪽에서 빼꼼
        ================================= */}

        <article
          className="
            contentCard
            boardCard
            mascotBoardCard
            mascotBoardSchedule
          "
        >

          <div
            className="
              cardMascot
              cardMascotPeek
            "
            aria-hidden="true"
          >
            <img
              src="/mobaxia-character.png"
              alt=""
              className="cardMascotImage"
            />
          </div>

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

            캐릭터 + 업보 팻말
        ================================= */}

        <article
          className="
            contentCard
            mascotBoardCard
            mascotBoardUpbo
          "
        >

          <div
            className="
              cardMascot
              cardMascotBite
            "
            aria-hidden="true"
          >

            <img
              src="/mobaxia-character.png"
              alt=""
              className="cardMascotImage"
            />

            <span className="mascotMiniSign">
              업보
            </span>

          </div>

          <div className="cardTitle">

            <h3>
              업보현황
            </h3>

            <span>
              Roulette
            </span>

          </div>

          <div className="upboList">

            {/* 1줄 */}

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

            {/* 2줄 */}

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

            {/* 3줄 */}

            <div
              className="
                upboRow
                upboSearchRow
              "
            >

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

            {/* 4줄 */}

            <div
              className="
                upboRow
                upboResultRow
              "
            >

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
   SOOP 프로필 이미지
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