import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import {
  MdLooks,
  MdOutlineSettings,
  MdOutlineMusicNote,
  MdPersonOutline,
  MdOutlineAdminPanelSettings,
} from 'react-icons/md';
import p from '@/global_states/profile';
import MenuItem from './menu_item';

function Menu() {
  const profile = p.useState()!;
  return (
    <div>
      <MenuItem
        to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.HOME}`}
        label="发现"
        icon={<MdLooks />}
      />
      <MenuItem
        to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_MUSIC}`}
        label="我的音乐"
        icon={<MdOutlineMusicNote />}
      />
      <MenuItem
        to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_SINGER}`}
        label="我的歌手"
        icon={<MdPersonOutline />}
      />
      {profile.super ? (
        <MenuItem
          to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.SUPER}`}
          label="超级管理员"
          icon={<MdOutlineAdminPanelSettings />}
        />
      ) : null}
      <MenuItem
        to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.SETTING}`}
        label="设置"
        icon={<MdOutlineSettings />}
      />
    </div>
  );
}

export default Menu;
