import type { Product } from "@/lib/store";

export function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className={`product-visual product-visual-${product.accent} ${compact ? "product-visual-compact" : ""}`} aria-label={`Visual ilustrativo de ${product.name}`}>
      <div className="visual-glow" />
      <div className="visual-shadow" />
      {product.category === "Fragrance" ? (
        <div className="visual-perfume">
          <div className="perfume-cap" />
          <div className="perfume-body"><span>L</span><small>EAU DE PEAU</small></div>
        </div>
      ) : product.category === "Body" ? (
        <div className="visual-oil">
          <div className="oil-neck" />
          <div className="oil-cap" />
          <div className="oil-body"><span>lumera</span><small>body oil</small></div>
        </div>
      ) : (
        <div className={`visual-jar ${product.category === "Hair" ? "visual-jar-wide" : ""}`}>
          <div className="jar-lid" />
          <div className="jar-body"><span>L</span><small>{product.category === "Hair" ? "terra mask" : "essentials"}</small></div>
        </div>
      )}
      <div className="visual-note">{product.note}</div>
    </div>
  );
}
