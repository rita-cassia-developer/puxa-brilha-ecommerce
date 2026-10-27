import type { Product } from "@/lib/store";
import { useEffect, useState } from "react";

export function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  const imageSrc = product.imageUrl?.trim();
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [imageSrc]);
  const showImage = Boolean(imageSrc) && !imageFailed;
  return (
    <div className={`product-visual product-visual-${product.accent} ${compact ? "product-visual-compact" : ""}`} aria-label={`Visual ilustrativo de ${product.name}`}>
      {showImage ? <img className="product-real-image" src={imageSrc} alt={product.name} onError={() => setImageFailed(true)} /> : <>
        <div className="visual-glow" />
        <div className="visual-shadow" />
        <div className="visual-jar visual-jar-wide">
          <div className="jar-lid" />
          <div className="jar-body"><span>PB</span><small>PUXA E BRILHA</small></div>
        </div>
        <div className="visual-note">{product.note}</div>
      </>}
    </div>
  );
}
