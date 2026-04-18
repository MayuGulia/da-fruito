import React from "react";

const MSG = "FREE DELIVERY ACROSS DELHI & NCR  ·  HANDCRAFTED GIFT HAMPERS  ·  IMPORTED CONFECTIONS FROM 4 CONTINENTS  ·  BESPOKE ORDERS WELCOME  ·  EXCLUSIVELY IN DELHI & NCR";

export const AnnouncementBar = () => (
  <div
    data-testid="announcement-bar"
    className="relative w-full overflow-hidden bg-[#1E5C5A] text-white"
    style={{ height: 36 }}
  >
    <div className="marquee-track flex whitespace-nowrap items-center h-full">
      <span className="font-ui text-[11px] tracking-[0.1em] uppercase px-6">{MSG}</span>
      <span className="font-ui text-[11px] tracking-[0.1em] uppercase px-6">{MSG}</span>
      <span className="font-ui text-[11px] tracking-[0.1em] uppercase px-6">{MSG}</span>
      <span className="font-ui text-[11px] tracking-[0.1em] uppercase px-6">{MSG}</span>
    </div>
  </div>
);
export default AnnouncementBar;
