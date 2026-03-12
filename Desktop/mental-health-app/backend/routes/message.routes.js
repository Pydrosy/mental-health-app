const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const Message = require('../models/message.model');

const router = express.Router();

// Get conversation between two users
router.get('/conversation/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: userId },
        { sender: userId, recipient: req.userId }
      ],
      deleted: false
    })
    .populate('sender', 'profile.firstName profile.lastName profile.profilePicture')
    .populate('recipient', 'profile.firstName profile.lastName profile.profilePicture')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        recipient: req.userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    const total = await Message.countDocuments({
      $or: [
        { sender: req.userId, recipient: userId },
        { sender: userId, recipient: req.userId }
      ]
    });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's conversations list
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.userId },
            { recipient: req.userId }
          ],
          deleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.userId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$recipient', req.userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          'user.profile': 1,
          'user.role': 1,
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
});

// Send a new message
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { recipientId, content, messageType = 'text', attachments = [] } = req.body;

    const message = new Message({
      sender: req.userId,
      recipient: recipientId,
      content,
      messageType,
      attachments
    });

    await message.save();

    await message.populate('sender', 'profile.firstName profile.lastName profile.profilePicture');
    await message.populate('recipient', 'profile.firstName profile.lastName profile.profilePicture');

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
});

// Delete message
router.delete('/:messageId', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete message
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Soft delete
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Edit message
router.patch('/:messageId', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can edit message
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Can only edit within 5 minutes
    const timeDiff = Date.now() - message.createdAt.getTime();
    if (timeDiff > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be edited within 5 minutes of sending'
      });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message updated successfully',
      updatedMessage: message
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;