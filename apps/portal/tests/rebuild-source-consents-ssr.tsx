import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {OverlayProvider} from '../src/ui/index.ts';
import {SourceConsentSection,SourceConsentReviewForm} from '../src/features/account/source-consents/SourceConsents.tsx';
import type {SourceConsentsModel,SourceConsentReview} from '../src/features/account/source-consents/types.ts';

export const renderSection=(model:SourceConsentsModel)=>renderToStaticMarkup(createElement(OverlayProvider,{children:createElement(SourceConsentSection,{model})}));
export const renderReview=(model:SourceConsentsModel,review:SourceConsentReview)=>renderToStaticMarkup(createElement(SourceConsentReviewForm,{model,review}));
/** Exercise the actual production form callbacks without claiming a DOM/keyboard journey. */
export const reviewForm=(model:SourceConsentsModel,review:SourceConsentReview)=>SourceConsentReviewForm({model,review});
