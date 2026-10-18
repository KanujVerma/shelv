import React from 'react';
import {AppReplayPrivacyBoundary} from '../../src/components/privacy/AppReplayPrivacyBoundary';
import {AppReplayControls} from '../../src/components/privacy/AppReplayControls';
export function LocalReplayProbe(){return <AppReplayPrivacyBoundary><AppReplayControls/></AppReplayPrivacyBoundary>;}
