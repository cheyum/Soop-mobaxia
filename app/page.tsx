"use client";

import { useEffect, useState } from "react";

type LiveStatus = {
  live: boolean;
  error?: boolean;
};

export default function Home() {
  const [status, setStatus] = useState<LiveStatus>({
    live: false,
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
      console.error("방송 상태 확인 실패", error);

      setStatus({
        live: false,
        error: true,
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    checkLive();

    // 1분마다 방송 상태 새로 확인
    const timer = setInterval(checkLive, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="page">

      {/* 배경 장식 */}
      <div className="decoration heart1">♡</div>
      <div className="decoration heart2">♡</div>
      <div className="decoration star1">✦</div>
      <div className="decoration star2">✧</div>

      {/* 상단 */}
      <header className="header">

        <div className="brand">
          <div className="brandHeart">♥</div>

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
              바샤좀 놀아죠!
            </>
          ) : (
            <>
              <span className="statusDot offlineDot" />
              바샤는 쉬는중
            </>
          )}

        </div>

      </header>


      {/* 메인 카드 */}
      <section className="heroCard">

        <div className="cuteTag">
          ♡ S급 서민영애 청설모 모씨 모바샤🐿️ ♡
        </div>


        {/* 프로필 */}
        <div
          className={`profileWrapper ${
            status.live ? "profileLive" : ""
          }`}
        >
          <ProfileImage />
        </div>


        {/* 이름 */}
        <div className="nameArea">

          <span className="littleHeart">
            ♥
          </span>

          <h2>모바샤</h2>

          <span className="littleHeart">
            ♥
          </span>

        </div>

        <p className="subTitle">
          생일 : 8월25일 / 언제나 24살 / 감성파 ESTJ
        </p>


        {/* 방송 상태 */}
        <div
          className={
            status.live
              ? "broadcastStatus broadcastLive"
              : "broadcastStatus broadcastOffline"
          }
        >

          {loading ? (
            <>
              <span className="broadcastDot" />
              방송 상태를 확인하고 있어요
            </>
          ) : status.live ? (
            <>
              <span className="broadcastDot" />
              LIVE · 바샤랑 노라죠!!!
            </>
          ) : (
            <>
              <span className="moonIcon">
                ♡
              </span>
              OFFLINE
              <span>♡</span>
            </>
          )}

        </div>


        {/* 메시지 */}
        <div className="messageBox">

          {status.live ? (
            <>
              <span>💗</span>

              <p>
                모바샤가 기다리고 있어요!
                <br />
                지금 방송에 놀러오세요.
              </p>

              <span>💗</span>
            </>
          ) : (
            <>
              <p>
                🌸 상세 스케쥴은 캘린더 참고 🌸
                <br />
                매주 월~금 오후 6시 , 토~일 오후 11시 (주1회 휴방) 바샤 등장( ̳- ·̫ - ̳ˆ )◞❤︎
              </p>

            </>
          )}

        </div>


        {/* 버튼 */}
        <a
          href="https://www.sooplive.com/station/mobaxia"
          target="_blank"
          rel="noopener noreferrer"
          className={
            status.live
              ? "soopButton liveButton"
              : "soopButton"
          }
        >

          <span className="buttonHeart">
            ♥
          </span>

          {status.live
            ? "지금 방송 보러가기"
            : "모바샤 방송국 놀러가기"}

          <span className="arrow">
            →
          </span>

        </a>


        {/* 아래 문구 */}
        <div className="footerMessage">
          <span>✦</span>
          오늘도 모바샤와 함께 행복한 하루
          <span>✦</span>
        </div>

      <section className="bottomSections">

  {/* 자유게시판 */}
  <div className="infoBox">
    <div className="infoBoxHeader">
      <h3>자유게시판</h3>
      <span>Free Board</span>
    </div>

    <ul className="postList">
      <li>
        <a href="#">모바샤 오늘 방송 너무 재밌었어요 💗</a>
      </li>
      <li>
        <a href="#">팬아트 올려도 되나요?</a>
      </li>
      <li>
        <a href="#">다음 합방 일정 기대중이에요!</a>
      </li>
      <li>
        <a href="#">굿즈 나오면 사고 싶어요 🌸</a>
      </li>
    </ul>

    <button className="miniButton">
      게시판 바로가기
    </button>
  </div>


  {/* 공지사항 */}
  <div className="infoBox">
    <div className="infoBoxHeader">
      <h3>공지사항</h3>
      <span>Notice</span>
    </div>

    <ul className="postList noticeList">
      <li>
        <a href="#">[공지] 방송 일정은 캘린더 참고 부탁드려요</a>
      </li>
      <li>
        <a href="#">[공지] 방송국 규칙을 확인해주세요</a>
      </li>
      <li>
        <a href="#">[공지] 이벤트 참여 방법 안내</a>
      </li>
      <li>
        <a href="#">[공지] 배너 및 팬아트 제보 환영 ♡</a>
      </li>
    </ul>

    <button className="miniButton">
      공지 전체보기
    </button>
  </div>


  {/* 배너 */}
  <div className="infoBox bannerBox">
    <div className="infoBoxHeader">
      <h3>배너</h3>
      <span>Banner</span>
    </div>

    <a
      href="https://www.sooplive.com/station/mobaxia"
      target="_blank"
      rel="noopener noreferrer"
      className="bannerCard"
    >
      <div className="bannerInner">
        <div className="bannerSmall">MOBASHA</div>
        <div className="bannerTitle">모바샤 방송국</div>
        <div className="bannerText">
          방송 보러가기 · 소식 확인하기
        </div>
      </div>
    </a>

    <a
      href="#"
      className="subBanner"
    >
      팬카페 / SNS / 일정표 배너 영역
    </a>
  </div>

</section>
</section>

      {/* 하단 */}
      <footer className="footer">

        <span>
          ♡
        </span>

        MOBASHA FAN PAGE

        <span>
          ♡
        </span>

      </footer>

    </main>
  );
}


/* =============================
   SOOP 프로필 자동 연동
============================= */

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

  const [index, setIndex] = useState(0);
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