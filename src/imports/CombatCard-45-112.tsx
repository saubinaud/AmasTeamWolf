import imgRectangle2 from "figma:asset/b6c678fbc62b58d18e7f160f8cd8738ca55e80fe.png";
import imgRectangle3 from "figma:asset/70e1ca6c94835c03b2c811385481918461365e29.png";

/**
 * @figmaAssetKey 50a7758c89d67309d3b3637f844bce840b4e6905
 */
function CombatCard({ className }: { className?: string }) {
  return (
    <div className={className} data-name="combat card">
      <div className="absolute bg-[#222222] inset-0 rounded-[41.261px]" />
      <div className="absolute bottom-[35.29%] left-0 right-0 rounded-tl-[41.261px] rounded-tr-[41.261px] top-0">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-tl-[41.261px] rounded-tr-[41.261px] size-full" src={imgRectangle2} />
      </div>
      <div className="absolute inset-[68.75%_78.73%_18.02%_4.98%] rounded-[8.252px]">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8.252px] size-full" src={imgRectangle3} />
      </div>
      <p className="absolute font-['DM_Sans:SemiBold',_sans-serif] font-semibold inset-[88.23%_5.53%_5.3%_76.92%] leading-[normal] text-[22.115px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'opsz' 14" }}>
        S/220
      </p>
      <p className="absolute font-['DM_Sans:SemiBold',_sans-serif] font-semibold inset-[87.5%_44.58%_5.37%_4.98%] leading-[normal] text-[24.277px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'opsz' 14" }}>
        Combat Wepon
      </p>
    </div>
  );
}

export default function CombatCard1() {
  return <CombatCard className="relative size-full" />;
}