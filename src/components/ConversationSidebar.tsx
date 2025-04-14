import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Divider,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Conversation } from '../types';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewConversation}
        >
          새 대화
        </Button>
      </Box>
      
      <Divider />
      
      <Box sx={{ 
        flex: '1 0 40%',
        borderBottom: 1,
        borderColor: '#e0e0e0',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '8px',
          display: 'none',
        },
        '&:hover::-webkit-scrollbar': {
          display: 'block',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#a8a8a8',
          },
        },
      }}>
        <List>
          {conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              disablePadding
              secondaryAction={
                onDeleteConversation && (
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onDeleteConversation(conversation.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemButton
                selected={conversation.id === currentConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: '#4b6bfb15',
                    '&:hover': {
                      backgroundColor: '#4b6bfb25',
                    }
                  },
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        color: '#2c3e50',
                        fontWeight: conversation.id === currentConversationId ? 500 : 400,
                        fontSize: '0.9rem',
                      }}
                    >
                      {conversation.title}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.8rem',
                      }}
                      noWrap
                    >
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default ConversationSidebar;