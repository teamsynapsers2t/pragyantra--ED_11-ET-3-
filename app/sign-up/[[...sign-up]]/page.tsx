import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <>
      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }
        .auth-card-wrapper {
          position: relative;
          z-index: 1;
          margin: 2rem 0;
        }
        @media (min-width: 768px) {
          .auth-card-wrapper {
            position: absolute;
            right: 8%;
            top: 50%;
            transform: translateY(-50%);
            margin: 0;
          }
        }
        @media (min-width: 1200px) {
          .auth-card-wrapper {
            right: 12%;
          }
        }
      `}</style>
      
      <div className="auth-container">
        {/* Background Video */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src="/whatsapp-video.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay: fades from lighter dark on the left to deeper dark on the right */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(10, 13, 20, 0.4) 0%, rgba(10, 13, 20, 0.75) 60%, rgba(10, 13, 20, 0.95) 100%)",
          }} />
        </div>

        {/* Clerk Card Wrapper */}
        <div className="auth-card-wrapper">
          <SignUp fallbackRedirectUrl="/dashboard" />
        </div>
      </div>
    </>
  );
}
