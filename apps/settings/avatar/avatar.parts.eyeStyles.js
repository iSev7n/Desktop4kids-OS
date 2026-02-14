  // avatar.parts.eyeStyles.js
  // Auto-split from apps/settings/avatar.js (no behavior changes)
  (function () {
    const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
    const { clamp, darkenHex, outfitBase } = A;
    const Parts = (A.Parts = A.Parts || {});

    Parts.eyeStyles = {
      _browsSoft(ctx) {
        const { lx, rx, y, R } = ctx;
        const browY = y - R * 0.22;
        const browW = R * 0.42;
        const browLift = R * 0.06;
        const browT = clamp(R * 0.070, 1.9, 2.7);
        const browColor = ctx.hairColor || "#1a1a1a";

        return `
          <path d="M ${lx - browW * 0.50} ${browY}
                  Q ${lx} ${browY - browLift} ${lx + browW * 0.50} ${browY}"
                stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round" fill="none"/>
          <path d="M ${rx - browW * 0.50} ${browY}
                  Q ${rx} ${browY - browLift} ${rx + browW * 0.50} ${browY}"
                stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round" fill="none"/>
        `;
      },

      simple(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 1.70;
        const pupilR = pr * 1.05;
        const brows = Parts.eyeStyles._browsSoft(ctx);

        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.95"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.95"/>
          <circle cx="${lx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${rx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${lx + pr * 0.65}" cy="${y - pr * 0.55}" r="${pr * 0.45}" fill="white" opacity="0.85"/>
          <circle cx="${rx + pr * 0.65}" cy="${y - pr * 0.55}" r="${pr * 0.45}" fill="white" opacity="0.85"/>
        `;
      },

      cute(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 1.80;
        const pupilR = pr * 1.15;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${lx}" cy="${y + pr * 0.25}" r="${pupilR}" fill="${ink}" opacity="0.88"/>
          <circle cx="${rx}" cy="${y + pr * 0.25}" r="${pupilR}" fill="${ink}" opacity="0.88"/>
          <circle cx="${lx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.85"/>
          <circle cx="${rx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.85"/>`;
      },

      wide(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 1.95;
        const pupilR = pr * 1.10;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${lx}" cy="${y + pr * 0.10}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${rx}" cy="${y + pr * 0.10}" r="${pupilR}" fill="${ink}" opacity="0.90"/>`;
      },

      happy(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y}
                   q ${pr * 3.0} ${pr * 2.2} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.90"/>
          <path d="M ${rx - pr * 3.0} ${y}
                   q ${pr * 3.0} ${pr * 2.2} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.90"/>`;
      },

      sleepy(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>
          <path d="M ${rx - pr * 3.0} ${y} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>`;
      },

      wink(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        const scleraR = pr * 2.05;
        const pupilR = pr * 1.05;
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.95"/>
          <circle cx="${lx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${lx + pr * 0.65}" cy="${y - pr * 0.55}" r="${pr * 0.45}" fill="white" opacity="0.85"/>
          <path d="M ${rx - pr * 3.0} ${y} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>`;
      },

      focused(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y - pr * 0.60} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>
          <path d="M ${rx - pr * 3.0} ${y - pr * 0.60} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>
          <circle cx="${lx}" cy="${y + pr * 0.55}" r="${pr * 0.70}" fill="${ink}" opacity="0.82"/>
          <circle cx="${rx}" cy="${y + pr * 0.55}" r="${pr * 0.70}" fill="${ink}" opacity="0.82"/>`;
      },

      sparkle(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 2.15;
        const pupilR = pr * 1.10;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${lx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.86"/>
          <circle cx="${rx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.86"/>
          <circle cx="${lx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.90"/>
          <circle cx="${rx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.90"/>
          <circle cx="${lx + pr * 1.35}" cy="${y - pr * 0.05}" r="${pr * 0.22}" fill="white" opacity="0.75"/>
          <circle cx="${rx + pr * 1.35}" cy="${y - pr * 0.05}" r="${pr * 0.22}" fill="white" opacity="0.75"/>`;
      },

angry(ctx) {
  const { lx, rx, y, pr, ink, R, hairColor } = ctx;
  const browColor = hairColor || "rgba(0,0,0,0.55)";

  const browY = y - R * 0.32;
  const browW = R * 0.62;

  const browT = clamp(R * 0.070, 1.9, 2.7);

  const scleraR = pr * 1.90;
  const pupilR = pr * 1.05;

  const pupilY = y + pr * 0.20;

  return `
    <path d="M ${lx - browW * 0.55} ${browY - R * 0.03}
             L ${lx + browW * 0.55} ${browY + R * 0.10}"
          stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round"/>
    <path d="M ${rx + browW * 0.55} ${browY - R * 0.03}
             L ${rx - browW * 0.55} ${browY + R * 0.10}"
          stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round"/>

    <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.94"/>
    <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.94"/>

    <circle cx="${lx}" cy="${pupilY}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
    <circle cx="${rx}" cy="${pupilY}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
  `;
},

      shy(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.10, 2.0, 3.0);

        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y} q ${pr * 3.0} ${pr * 1.8} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.88"/>
          <path d="M ${rx - pr * 3.0} ${y} q ${pr * 3.0} ${pr * 1.8} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.88"/>`;
      },
    };
  })();
