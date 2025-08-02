import React from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useLanguage, Language } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    handleClose();
  };

  const getLanguageIcon = (lang: Language) => {
    return lang === 'vi' ? '🇻🇳' : '🇺🇸';
  };

  const getLanguageName = (lang: Language) => {
    return lang === 'vi' ? t('vietnamese') : t('english');
  };

  return (
    <Box>
      <Tooltip title={t('language')}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'white',
            },
          }}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => handleLanguageChange('vi')}
          selected={language === 'vi'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 150,
          }}
        >
          <Typography variant="h6">🇻🇳</Typography>
          <Typography>{t('vietnamese')}</Typography>
        </MenuItem>
        
        <MenuItem
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 150,
          }}
        >
          <Typography variant="h6">🇺🇸</Typography>
          <Typography>{t('english')}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher; 