
import React from 'react';

type IconProps = {
  className?: string;
};

// --- REDESIGNED PROFESSIONAL ICON SET ---
// New icons designed to be more anatomical, dynamic, and suitable for a professional fitness application.

export const BackIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M8 6V3h8v3" }),
    React.createElement('path', { d: "M10 3v3" }),
    React.createElement('path', { d: "M14 3v3" }),
    React.createElement('path', { d: "M8 6c-2 3-5 5-5 9v3h18v-3c0-4-3-6-5-9" }),
    React.createElement('path', { d: "M12 11c-1.5 0-3 1-3 3v5h6v-5c0-2-1.5-3-3-3z" })
);

export const ShoulderIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('circle', { cx: "12", cy: "8", r: "4" }),
    React.createElement('path', { d: "M5 14a7 7 0 0 0 14 0" }),
    React.createElement('path', { d: "M8 21v-4.5" }),
    React.createElement('path', { d: "M16 21v-4.5" })
);

export const ChestIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M12 5C7.03 5 3 7.69 3 11v2c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3v-2c0-3.31-4.03-6-9-6z" }),
    React.createElement('path', { d: "M3 13h18" }),
    React.createElement('path', { d: "M12 5v14" })
);

export const ArmIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M15 6V5a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3v1" }),
    React.createElement('path', { d: "M14 11.5c1.5-1 1.5-3 0-4" }),
    React.createElement('path', { d: "M10 11.5c-1.5-1-1.5-3 0-4" }),
    React.createElement('path', { d: "M7 22v-6a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v6" })
);

export const AbsIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M12 4c-4 0-7 3-7 7v6h14v-6c0-4-3-7-7-7z" }),
    React.createElement('path', { d: "M12 11h.01" }),
    React.createElement('path', { d: "M12 14h.01" }),
    React.createElement('path', { d: "M9 11h.01" }),
    React.createElement('path', { d: "M15 11h.01" }),
    React.createElement('path', { d: "M9 14h.01" }),
    React.createElement('path', { d: "M15 14h.01" }),
    React.createElement('path', { d: "M5 11h14" })
);

export const ButtIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M12 10c-4 0-6 2-6 5v3h12v-3c0-3-2-5-6-5z" }),
    React.createElement('path', { d: "M12 10V4" }),
    React.createElement('path', { d: "M9 4h6" }),
    React.createElement('path', { d: "M8 21v-3" }),
    React.createElement('path', { d: "M16 21v-3" })
);

export const LegIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M9.5 12H12v9" }),
    React.createElement('path', { d: "M14.5 12H12" }),
    React.createElement('path', { d: "M12 12V3" }),
    React.createElement('path', { d: "M6 3h12" })
);

export const LoseWeightIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M15.5 13.5 19 10" }),
    React.createElement('path', { d: "M15 10h4v4" }),
    React.createElement('circle', { cx: "9", cy: "6", r: "2" }),
    React.createElement('path', { d: "m13 10-1.2-1.2a2.83 2.83 0 0 0-4 0L4 12.5" }),
    React.createElement('path', { d: "m4.5 19.5 3-3" }),
    React.createElement('path', { d: "m12.5 12.5 3.5 3.5" })
);

export const BuildMuscleIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M7 20v-5" }),
    React.createElement('path', { d: "M17 20v-5" }),
    React.createElement('path', { d: "M12 20v-4" }),
    React.createElement('path', { d: "M12 4a4 4 0 0 1 4 4c0 2.2-1.8 4-4 4s-4-1.8-4-4a4 4 0 0 1 4-4z" }),
    React.createElement('path', { d: "M9 12a5 5 0 0 0 6 0" })
);

export const KeepFitIcon: React.FC<IconProps> = ({ className }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
    React.createElement('path', { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })
);
