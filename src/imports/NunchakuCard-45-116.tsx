import imgRectangle7 from "figma:asset/3ac1101d13921071a15b96609e884a79f6170622.png";
import imgRectangle8 from "figma:asset/52f631fe99933e535c3d74c7c53da43cb520486a.png";

/**
 * @figmaAssetKey 8a1504a0ca10102dfacea6f1381a0b9b8b25d1c5
 */
function NunchakuCard({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Nunchaku card">
      <div className="absolute bg-[#222222] inset-0 rounded-[41.261px]" />
      <div className="absolute bottom-[35.29%] left-0 right-0 rounded-tl-[41.261px] rounded-tr-[41.261px] top-0">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-tl-[41.261px] rounded-tr-[41.261px] size-full" src={imgRectangle7} />
      </div>
      <div className="absolute inset-[68.75%_78.73%_18.02%_4.98%] rounded-[8.252px]">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8.252px] size-full" src={imgRectangle8} />
      </div>
      <p className="absolute font-['DM_Sans:SemiBold',_sans-serif] font-semibold inset-[88.23%_4.63%_5.3%_77.83%] leading-[normal] text-[22.115px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'opsz' 14" }}>
        S/350
      </p>
      <p className="absolute font-['DM_Sans:SemiBold',_sans-serif] font-semibold inset-[87.5%_61.77%_5.37%_5.88%] leading-[normal] text-[24.277px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'opsz' 14" }}>
        Nunchaku
      </p>
    </div>
  );
}

export default function NunchakuCard1() {
  return <NunchakuCard className="relative size-full" />;
}