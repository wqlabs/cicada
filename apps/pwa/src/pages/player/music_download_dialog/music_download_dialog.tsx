import Dialog from '#/components/dialog';
import { CSSProperties } from 'react';
import Button from '#/components/button';
import styled from 'styled-components';
import formatMusicFilename from '#/utils/format_music_filename';
import { saveAs } from 'file-saver';
import { Music } from '../constants';
import MusicInfo from '../components/music_info';

const bodyProps: {
  style: CSSProperties;
} = {
  style: {
    width: 250,
  },
};
const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

function MusicDownloadDialog({
  open,
  onClose,
  music,
}: {
  open: boolean;
  onClose: () => void;
  music: Music;
}) {
  const { name, singers, sq, hq, ac } = music;
  const onDownload = (url: string) => {
    const parts = url.split('.');
    saveAs(
      url,
      formatMusicFilename({
        name,
        singerNames: singers.map((s) => s.name),
        ext: `.${parts[parts.length - 1]}`,
      }),
    );
    return onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} bodyProps={bodyProps}>
      <MusicInfo music={music} />
      <Style>
        <Button onClick={() => onDownload(sq)}>标准音质</Button>
        {hq ? <Button onClick={() => onDownload(hq)}>无损音质</Button> : null}
        {ac ? <Button onClick={() => onDownload(ac)}>伴奏</Button> : null}
      </Style>
    </Dialog>
  );
}

export default MusicDownloadDialog;