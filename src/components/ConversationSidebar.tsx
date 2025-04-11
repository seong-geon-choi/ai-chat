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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
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
                >
                  <DeleteIcon />
                </IconButton>
              )
            }
          >
            <ListItemButton
              selected={conversation.id === currentConversationId}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <ListItemText
                primary={conversation.title}
                secondary={
                  <Typography
                    variant="caption"
                    color="text.secondary"
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
  );
};

export default ConversationSidebar;