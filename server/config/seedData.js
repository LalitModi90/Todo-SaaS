const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');

const seedInitialData = async () => {
  try {
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    // 1. Always ensure demo/seed users exist and have valid passwords set
    const usersData = [
      { name: 'Lalit Modi', email: 'lalitmodi7878065@gmail.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Lalit+Modi' },
      { name: 'Ankit Dutta', email: 'ankit@gmail.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ankit' },
      { name: 'Admin', email: 'admin@gmail.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin' },
      { name: 'Security Team', email: 'security@gmail.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Security' }
    ];

    const users = {};
    for (const u of usersData) {
      let userDoc = await User.findOne({ email: u.email });
      if (!userDoc) {
        userDoc = await User.create({
          name: u.name,
          email: u.email,
          password: defaultPasswordHash,
          avatar: u.avatar,
          isVerified: true
        });
      } else if (!userDoc.password) {
        userDoc.password = defaultPasswordHash;
        await userDoc.save();
      }
      users[u.name] = userDoc;
    }

    const taskCount = await Task.countDocuments();
    if (taskCount > 0) {
      console.log('Database already has task data. Demo user passwords verified.');
      return;
    }

    console.log('Seeding initial mock data into database...');

    // 2. Workspace
    let workspaceDoc = await Workspace.findOne({ name: 'Lalit Workspace' });
    if (!workspaceDoc) {
      workspaceDoc = await Workspace.create({
        name: 'Lalit Workspace',
        owner: users['Lalit Modi']._id,
        members: [users['Lalit Modi']._id, users['Ankit Dutta']._id, users['Admin']._id]
      });
    }

    // 3. Projects
    const projectsData = [
      {
        title: 'Design Homepage',
        priority: 'High',
        lead: users['Lalit Modi']._id,
        members: [users['Lalit Modi']._id],
        dueDate: new Date('2026-09-12')
      },
      {
        title: 'Develop Login Feature',
        priority: 'Low',
        lead: users['Ankit Dutta']._id,
        members: [users['Ankit Dutta']._id],
        dueDate: new Date('2026-09-15')
      },
      {
        title: 'Test Payment Gateway',
        priority: 'Medium',
        lead: users['Admin']._id,
        members: [users['Admin']._id],
        dueDate: new Date('2026-09-18')
      }
    ];

    const projects = {};
    for (const p of projectsData) {
      let projDoc = await Project.findOne({ title: p.title });
      if (!projDoc) {
        projDoc = await Project.create(p);
      }
      projects[p.title] = projDoc;
    }

    // 4. Tasks
    const tasksData = [
      {
        title: 'Write API Documentation',
        description: 'Create clear and detailed API documentation.',
        status: 'todo',
        priority: 'High',
        project: projects['Design Homepage']._id,
        assignedTo: [users['Lalit Modi']._id],
        creator: users['Lalit Modi']._id,
        isPublic: false,
        labels: ['Research', 'Design', 'Development', 'Testing', 'Deployment'],
        dueDate: new Date('2026-07-29'),
        subtasks: [
          { title: 'Create API endpoints', completed: true },
          { title: 'Write authentication docs', completed: false },
          { title: 'Review API response', completed: false }
        ]
      },
      {
        title: 'Code Review Completed',
        description: 'Review completed code.',
        status: 'doing',
        priority: 'Medium',
        project: projects['Develop Login Feature']._id,
        assignedTo: [users['Ankit Dutta']._id],
        creator: users['Ankit Dutta']._id,
        isPublic: false,
        labels: ['Review', 'Backend'],
        dueDate: new Date('2026-07-29'),
        subtasks: []
      },
      {
        title: 'Feature Testing Passed',
        description: 'Testing completed successfully.',
        status: 'completed',
        priority: 'High',
        project: projects['Test Payment Gateway']._id,
        assignedTo: [users['Admin']._id],
        creator: users['Admin']._id,
        isPublic: false,
        labels: ['Testing', 'Passed'],
        dueDate: new Date('2026-07-30'),
        subtasks: []
      },
      {
        title: 'Security Audit Scheduled',
        description: 'Perform security audit.',
        status: 'onhold',
        priority: 'Low',
        project: projects['Design Homepage']._id,
        assignedTo: [users['Security Team']._id],
        creator: users['Security Team']._id,
        isPublic: false,
        labels: ['Audit', 'Security'],
        dueDate: new Date('2026-08-01'),
        subtasks: []
      }
    ];

    for (const t of tasksData) {
      let taskDoc = await Task.findOne({ title: t.title });
      if (!taskDoc) {
        taskDoc = await Task.create(t);

        // Add comment for task1 if applicable
        if (t.title === 'Write API Documentation') {
          const commentDoc = await Comment.create({
            message: 'Documentation updated',
            taskId: taskDoc._id,
            userId: users['Ankit Dutta']._id
          });
          taskDoc.comments.push(commentDoc._id);
          await taskDoc.save();
        }
      }
    }

    console.log('Successfully seeded initial mock data!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedInitialData;
