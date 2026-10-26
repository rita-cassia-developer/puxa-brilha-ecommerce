import type { Product } from "@/lib/store";

export function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className={`product-visual product-visual-${product.accent} ${compact ? "product-visual-compact" : ""}`} aria-label={`Visual ilustrativo de ${product.name}`}>
      <div className="visual-glow" />
      <div className="visual-shadow" />
      <div className="visual-jar visual-jar-wide">
        <div className="jar-lid" />
        <div className="jar-body"><span>PB</span><small>PUXA E BRILHA</small></div>
      </div>
      <div className="visual-note">{product.note}</div>
    </div>
  );
}
