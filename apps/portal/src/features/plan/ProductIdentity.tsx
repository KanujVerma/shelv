import type {PlanProduct} from '../../../../../src/contracts/PortalRebuild.ts';
import {ProductPhoto} from './content.tsx';

export function ProductIdentity({ product, compact = false, sheet = false }: {
    product: PlanProduct;
    compact?: boolean;
    sheet?: boolean;
}) { return <div className={`plan-product-identity ${compact ? 'plan-product-compact' : ''}`}><ProductPhoto product={product} size={compact ? 'summary' : 'identity'}/><div>{product.brand && !sheet ? <p className="plan-meta">{product.brand}</p> : null}<h2>{(sheet ? product.name : product.variant) || product.name || 'product name not recorded'}</h2>{!compact ? <p className="plan-meta">{sheet && product.variant ? product.variant + ' · ' : ''}{product.sizeLabel || 'size not recorded'}{product.strength.state === 'known' ? ` · ${product.strength.value}` : null}</p> : null}</div></div>; }
