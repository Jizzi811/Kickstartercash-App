import React from 'react';
import { Composition } from 'remotion';
import { CountdownVideo } from './Countdown';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CountdownVideo"
      component={CountdownVideo}
      durationInFrames={300 * 30}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
