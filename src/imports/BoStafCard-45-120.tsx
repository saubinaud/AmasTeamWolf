import imgRectangle10 from "figma:asset/e673d59c5dc4910e1581110419577effc879e971.png";
import imgRectangle11 from "figma:asset/e4043a0f4ccec0f201b3a8db12cea8b6b2fdfa30.png";

/**
 * @figmaAssetKey 8185bae7e7b556cfb93b77de91a0e02c951908ec
 */
function BoStafCard({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Bo staf card">
      <div className="absolute bg-[#222222] inset-0 rounded-[41.261px]" />
      <div className="absolute bottom-[35.29%] left-0 right-0 rounded-tl-[41.261px] rounded-tr-[41.261px] top-0">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-tl-[41.261px] rounded-tr-[41.261px] size-full" src={imgRectangle10} />
      </div>
      <div className="absolute inset-[68.75%_78.73%_18.02%_4.98%] rounded-[8.252px]">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8.252px] size-full" src={imgRectangle11} />
      </div>
      <p className="absolute font-['DM_Sans:SemiBold',_sans-serif] font-semibold inset-[88.23%_5.72%_5.3%_77.83%] leading-[normal] text-[22.115px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'opsz' 14" }}>
        S/180
      </p>
      <p className="absolute font-['DM_Sans:SemiBold',_sans-serif] font-semibold inset-[87.5%_65.88%_5.37%_5.88%] leading-[normal] text-[24.277px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'opsz' 14" }}>
        Bo - Staf
      </p>
    </div>
  );
}

export default function BoStafCard1() {
  return <BoStafCard className="relative size-full" />;
}