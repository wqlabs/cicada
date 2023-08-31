import { useEffect, useState } from 'react';
import setting from '@/global_states/setting';
import throttle from 'lodash/throttle';
import uploadMusicPlayRecord from '@/server/base/upload_music_play_record';
import { EFFECTIVE_PLAY_PERCENT } from '#/constants';
import definition from '@/definition';
import { CacheName } from '@/constants/cache';
import logger from '@/utils/logger';
import { QueueMusic } from '../constants';
import onError from './on_error';
import eventemitter, { EventType } from '../eventemitter';

function getAudioPlayedSeconeds(audio: HTMLAudioElement) {
  const { played } = audio;
  let playedSeconeds = 0;
  for (let i = 0, { length } = played; i < length; i += 1) {
    const start = played.start(i);
    const end = played.end(i);
    playedSeconeds += end - start;
  }
  return playedSeconeds;
}
function uploadPlayRecord(audio: HTMLAudioElement, musicId: string) {
  const { duration } = audio;
  const playedSeconds = getAudioPlayedSeconeds(audio);
  return uploadMusicPlayRecord({
    musicId,
    percent: duration ? playedSeconds / duration : 0,
  });
}

function Audio({ queueMusic }: { queueMusic?: QueueMusic }) {
  const { playerVolume } = setting.useState();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    if (queueMusic) {
      const newAudio = new window.Audio();
      newAudio.crossOrigin = 'anonymous';
      newAudio.preload = 'auto';
      newAudio.autoplay = true;
      newAudio.loop = false;
      newAudio.src = queueMusic.asset;

      const onCanPlayThrough = () => setDuration(newAudio.duration);
      const onDurationChange = () => setDuration(newAudio.duration);
      const onPlay = () => setPaused(false);
      const onPause = () => setPaused(true);
      const onTimeUpdate = throttle(
        () =>
          eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
            currentMillisecond: newAudio.currentTime * 1000,
          }),
        300,
      );
      const onEnded = () => eventemitter.emit(EventType.ACTION_NEXT, null);
      const onWaiting = () => setLoading(true);
      const onPlaying = () => setLoading(false);
      const onProgress = () => {};
      const onSeeking = () => setLoading(true);
      const onSeeked = () => setLoading(false);

      newAudio.addEventListener('error', onError);
      newAudio.addEventListener('canplaythrough', onCanPlayThrough);
      newAudio.addEventListener('durationchange', onDurationChange);
      newAudio.addEventListener('play', onPlay);
      newAudio.addEventListener('pause', onPause);
      newAudio.addEventListener('timeupdate', onTimeUpdate);
      newAudio.addEventListener('ended', onEnded);
      newAudio.addEventListener('waiting', onWaiting);
      newAudio.addEventListener('playing', onPlaying);
      newAudio.addEventListener('progress', onProgress);
      newAudio.addEventListener('seeking', onSeeking);
      newAudio.addEventListener('seeked', onSeeked);
      // canplay
      // emptied
      // loaddata
      // loadstart
      // loadeddata
      // loadedmetadata
      // stalled
      // suspend

      setAudio(newAudio);
      return () => {
        /**
         * workbox 不支持缓存媒体
         * 需要手动进行缓存
         * 详情查看 https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video
         * @author mebtte<hi@mebtte.com>
         */
        if (
          definition.WITH_SW &&
          window.caches &&
          newAudio.duration &&
          getAudioPlayedSeconeds(newAudio) / newAudio.duration >
            EFFECTIVE_PLAY_PERCENT
        ) {
          window.caches.open(CacheName.ASSET_MEDIA).then(async (cache) => {
            const exist = await cache.match(queueMusic.asset);
            if (!exist) {
              cache
                .add(queueMusic.asset)
                .catch((error) =>
                  logger.error(
                    error,
                    `Failed to cache music "${queueMusic.asset}"`,
                  ),
                );
            }
          });
        }

        uploadPlayRecord(newAudio, queueMusic.id);

        newAudio.removeEventListener('error', onError);
        newAudio.removeEventListener('canplaythrough', onCanPlayThrough);
        newAudio.removeEventListener('durationchange', onDurationChange);
        newAudio.removeEventListener('play', onPlay);
        newAudio.removeEventListener('pause', onPause);
        newAudio.removeEventListener('timeupdate', onTimeUpdate);
        newAudio.removeEventListener('ended', onEnded);
        newAudio.removeEventListener('waiting', onWaiting);
        newAudio.removeEventListener('playing', onPlaying);
        newAudio.removeEventListener('progress', onProgress);
        newAudio.removeEventListener('seeking', onSeeking);
        newAudio.removeEventListener('seeked', onSeeked);

        setLoading(true);
        setDuration(0);
        setPaused(true);
        eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
          currentMillisecond: 0,
        });

        newAudio.src = ''; // pause audio and let it be garbage collected
      };
    }
  }, [queueMusic]);

  useEffect(() => {
    if (audio) {
      audio.volume = playerVolume;
    }
  }, [audio, playerVolume]);

  useEffect(() => {
    if (audio) {
      const unlistenActionSetTime = eventemitter.listen(
        EventType.ACTION_SET_TIME,
        ({ second }: { second: number }) =>
          window.setTimeout(() => {
            audio.currentTime = second;
            audio.play();
            eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
              currentMillisecond: second * 1000,
            });
          }, 0),
      );
      const unlistenActionPlay = eventemitter.listen(
        EventType.ACTION_PLAY,
        () => audio.play(),
      );
      const unlistenActionPause = eventemitter.listen(
        EventType.ACTION_PAUSE,
        () => audio.pause(),
      );
      const unlistenActionTogglePlay = eventemitter.listen(
        EventType.ACTION_TOGGLE_PLAY,
        () => (audio.paused ? audio.play() : audio.pause()),
      );
      return () => {
        unlistenActionSetTime();
        unlistenActionPlay();
        unlistenActionPause();
        unlistenActionTogglePlay();
      };
    }
  }, [audio]);

  useEffect(() => {
    if (audio && queueMusic) {
      const onBeforeUnload = () => uploadPlayRecord(audio, queueMusic.id);
      window.addEventListener('beforeunload', onBeforeUnload);
      return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }
  }, [audio, queueMusic]);

  return {
    loading,
    duration,
    paused,
  };
}

export default Audio;
