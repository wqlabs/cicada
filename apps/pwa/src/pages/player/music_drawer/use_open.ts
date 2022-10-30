import { useState, useEffect, useCallback } from 'react';
import eventemitter, { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';

export default () => {
  // const [open, setOpen] = useState(false);
  const [open, setOpen] = useState(true);
  const onClose = useCallback(() => setOpen(false), []);
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSIC_DRAWER);
  const [id, setId] = useState('toxlxwee');
  // const [id, setId] = useState('');

  useEffect(() => {
    const unlistenOpenMusicDrawer = eventemitter.listen(
      EventType.OPEN_MUSIC_DRAWER,
      (data) => {
        setId(data.id);
        return setOpen(true);
      },
    );
    return unlistenOpenMusicDrawer;
  }, []);

  return {
    open,
    onClose,
    id,
    zIndex,
  };
};
