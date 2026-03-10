import type { Node, Edge } from '@xyflow/react';
import type { StoryCardData } from '../types';

export interface ExampleMap {
  name: string;
  description: string;
  nodes: Node<StoryCardData>[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

export const exampleMaps: ExampleMap[] = [
  // ── E-commerce Store ──────────────────────────────────────────────
  {
    name: 'E-commerce Store',
    description: 'Product browsing, cart management, and checkout flow',
    nodes: [
      // Activities
      { id: 'activity-1', type: 'activity', position: { x: 300, y: 0 }, data: { title: 'Browse Products', description: 'Customers discover and explore the product catalog', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 'activity-2', type: 'activity', position: { x: 1050, y: 0 }, data: { title: 'Purchase', description: 'Cart management and checkout experience', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      // Steps
      { id: 'step-1-1', type: 'step', position: { x: 0, y: 127 }, data: { title: 'Search & Filter', description: 'Find products by keyword, category, or attributes', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-1-2', type: 'step', position: { x: 300, y: 127 }, data: { title: 'View Product', description: 'Inspect product details before buying', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-1-3', type: 'step', position: { x: 600, y: 127 }, data: { title: 'Reviews', description: 'Read and write product reviews', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-1', type: 'step', position: { x: 900, y: 127 }, data: { title: 'Manage Cart', description: 'Add, update, and remove items before checkout', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-2', type: 'step', position: { x: 1200, y: 127 }, data: { title: 'Checkout', description: 'Complete the purchase with payment and shipping', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      // Stories
      { id: 'story-1-1-1', type: 'storyCard', position: { x: 0, y: 254 }, data: {
        title: 'As a shopper, I want to search products by keyword so that I can quickly find what I need',
        description: 'A persistent search bar across all pages with type-ahead suggestions powered by the product catalog index. Results should appear within 200ms of the last keystroke.',
        acceptanceCriteria: ['Given I type 3+ characters, when suggestions load, then at most 8 matching products appear', 'Given I submit a search, when results display, then they are ranked by relevance', 'Given no results match, when the page renders, then a helpful empty state with suggestions is shown'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-1-1-2', type: 'storyCard', position: { x: 0, y: 554 }, data: {
        title: 'As a shopper, I want to filter products by category and price so that I can narrow down my options',
        description: 'Sidebar filters for category tree, price range slider, and brand checkboxes. Filters apply instantly without a full page reload and update the result count.',
        acceptanceCriteria: ['Given I select a category, when results update, then only products in that category are shown', 'Given I set a price range, when I release the slider, then results filter within that range', 'Given I combine multiple filters, when applied, then all filters are ANDed together'],
        cardType: 'story', priority: 'should-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-1-2-1', type: 'storyCard', position: { x: 300, y: 254 }, data: {
        title: 'As a shopper, I want to view a product detail page so that I can evaluate the item before buying',
        description: 'Full product page with zoomable image gallery, structured specs, pricing, stock availability, and a prominent add-to-cart button above the fold.',
        acceptanceCriteria: ['Given I open a product, when the page loads, then images, price, and description are visible', 'Given I click a thumbnail, when the gallery updates, then the main image changes with a smooth transition', 'Given the item is out of stock, when the page renders, then the add-to-cart button is disabled with a restock notice'],
        cardType: 'story', priority: 'must-have', estimate: 'L', status: 'not-started',
      } },
      { id: 'story-1-3-1', type: 'storyCard', position: { x: 600, y: 254 }, data: {
        title: 'As a shopper, I want to read product reviews so that I can make an informed purchase decision',
        description: 'Display verified-buyer reviews with star ratings, review text, and helpfulness votes. Show aggregate rating summary at the top.',
        acceptanceCriteria: ['Given a product has reviews, when the page loads, then an average star rating and review count are shown', 'Given I sort by most helpful, when reviews re-order, then highest-voted reviews appear first', 'Given a review is from a verified buyer, when it renders, then a verified badge is displayed'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-1-3-2', type: 'storyCard', position: { x: 600, y: 855 }, data: {
        title: 'As a customer, I want to write a product review so that I can share my experience with other shoppers',
        description: 'Review submission form with star rating selector, title, body text, and optional photo upload. Only available to users who purchased the item.',
        acceptanceCriteria: ['Given I have purchased the item, when I click "Write a Review", then the review form appears', 'Given I submit a review without a star rating, when I click submit, then a validation error is shown', 'Given I upload photos, when the review is saved, then thumbnails appear alongside the review text'],
        cardType: 'story', priority: 'could-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-1-1', type: 'storyCard', position: { x: 900, y: 254 }, data: {
        title: 'As a shopper, I want to add and remove items from my cart so that I can control what I purchase',
        description: 'Persistent shopping cart with real-time item count badge, quantity adjusters, and a running subtotal. Cart state survives page refreshes.',
        acceptanceCriteria: ['Given I click add-to-cart, when the item is added, then the cart badge increments and a confirmation toast appears', 'Given I change the quantity, when I adjust the stepper, then the line total and subtotal update immediately', 'Given I click remove, when the item is deleted, then it disappears and the subtotal recalculates'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-2-1', type: 'storyCard', position: { x: 1200, y: 254 }, data: {
        title: 'As a shopper, I want to check out as a guest so that I can complete my purchase without creating an account',
        description: 'Streamlined single-page checkout with shipping address, delivery method, and credit card payment. No account creation required.',
        acceptanceCriteria: ['Given I proceed to checkout, when the form loads, then shipping and payment sections are visible', 'Given I enter valid card details, when I submit payment, then the order is placed and a confirmation page appears', 'Given a payment fails, when the error is returned, then a clear message explains the issue and lets me retry'],
        cardType: 'story', priority: 'must-have', estimate: 'XL', status: 'not-started',
      } },
      { id: 'story-2-2-2', type: 'storyCard', position: { x: 1200, y: 554 }, data: {
        title: 'As a customer, I want to receive an order confirmation email so that I have a record of my purchase',
        description: 'Automated transactional email sent immediately after successful checkout with order summary, estimated delivery, and a link to track the shipment.',
        acceptanceCriteria: ['Given an order is placed, when payment succeeds, then a confirmation email is sent within 60 seconds', 'Given the email arrives, when the customer opens it, then it contains order number, items, totals, and shipping address', 'Given the order has tracking, when tracking is available, then the email includes a tracking link'],
        cardType: 'story', priority: 'should-have', estimate: 'S', status: 'not-started',
      } },
    ],
    edges: [
      { id: 'edge-activity-1-step-1-1', source: 'activity-1', target: 'step-1-1' },
      { id: 'edge-activity-1-step-1-2', source: 'activity-1', target: 'step-1-2' },
      { id: 'edge-activity-1-step-1-3', source: 'activity-1', target: 'step-1-3' },
      { id: 'edge-activity-2-step-2-1', source: 'activity-2', target: 'step-2-1' },
      { id: 'edge-activity-2-step-2-2', source: 'activity-2', target: 'step-2-2' },
      { id: 'edge-step-1-1-story-1-1-1', source: 'step-1-1', target: 'story-1-1-1' },
      { id: 'edge-step-1-1-story-1-1-2', source: 'step-1-1', target: 'story-1-1-2' },
      { id: 'edge-step-1-2-story-1-2-1', source: 'step-1-2', target: 'story-1-2-1' },
      { id: 'edge-step-1-3-story-1-3-1', source: 'step-1-3', target: 'story-1-3-1' },
      { id: 'edge-step-1-3-story-1-3-2', source: 'step-1-3', target: 'story-1-3-2' },
      { id: 'edge-step-2-1-story-2-1-1', source: 'step-2-1', target: 'story-2-1-1' },
      { id: 'edge-step-2-2-story-2-2-1', source: 'step-2-2', target: 'story-2-2-1' },
      { id: 'edge-step-2-2-story-2-2-2', source: 'step-2-2', target: 'story-2-2-2' },
    ],
    viewport: { x: 100, y: 50, zoom: 0.75 },
  },

  // ── Blog Platform ─────────────────────────────────────────────────
  {
    name: 'Blog Platform',
    description: 'Content creation, publishing, and reader engagement',
    nodes: [
      { id: 'activity-1', type: 'activity', position: { x: 150, y: 0 }, data: { title: 'Create Content', description: 'Authors write, edit, and manage blog posts', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 'activity-2', type: 'activity', position: { x: 750, y: 0 }, data: { title: 'Read & Engage', description: 'Readers discover, read, and interact with content', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 'step-1-1', type: 'step', position: { x: 0, y: 113 }, data: { title: 'Write Post', description: 'Compose and format blog content', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-1-2', type: 'step', position: { x: 300, y: 113 }, data: { title: 'Publish', description: 'Review and publish finished content', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-1', type: 'step', position: { x: 600, y: 113 }, data: { title: 'Browse Posts', description: 'Discover and navigate published content', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-2', type: 'step', position: { x: 900, y: 113 }, data: { title: 'Interact', description: 'Comment, like, and bookmark posts', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'story-1-1-1', type: 'storyCard', position: { x: 0, y: 226 }, data: {
        title: 'As an author, I want a rich text editor so that I can format posts with headings, images, and code blocks',
        description: 'WYSIWYG editor with a floating formatting toolbar, drag-and-drop image upload, and syntax-highlighted code blocks. Supports Markdown shortcuts for power users.',
        acceptanceCriteria: ['Given I select text, when I click bold/italic/heading, then the formatting is applied in real-time', 'Given I drag an image onto the editor, when I drop it, then the image uploads and embeds inline', 'Given I type a code fence (```), when I press Enter, then a syntax-highlighted code block appears'],
        cardType: 'story', priority: 'must-have', estimate: 'L', status: 'not-started',
      } },
      { id: 'story-1-1-2', type: 'storyCard', position: { x: 0, y: 527 }, data: {
        title: 'As an author, I want my drafts to auto-save so that I never lose work if I close the browser',
        description: 'Background auto-save triggers every 30 seconds when changes are detected. A subtle status indicator shows "Saving..." / "Saved" in the editor header.',
        acceptanceCriteria: ['Given I am editing a draft, when 30 seconds pass with changes, then the draft is saved automatically', 'Given the auto-save succeeds, when the save completes, then a "Saved" indicator appears in the toolbar', 'Given the network is offline, when auto-save fails, then a warning banner prompts me to save manually when reconnected'],
        cardType: 'story', priority: 'should-have', estimate: 'S', status: 'not-started',
      } },
      { id: 'story-1-2-1', type: 'storyCard', position: { x: 300, y: 226 }, data: {
        title: 'As an author, I want to publish a post with tags so that readers can discover it by topic',
        description: 'Publish dialog lets the author add up to 5 tags, set a featured image, and write a short excerpt. Tags are autocompleted from existing tags in the system.',
        acceptanceCriteria: ['Given I click Publish, when the dialog opens, then I can add tags and a featured image', 'Given I type a tag name, when matches exist, then autocomplete suggestions appear from the tag index', 'Given I confirm publish, when the post goes live, then it appears on the homepage feed immediately'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-1-2-2', type: 'storyCard', position: { x: 300, y: 840 }, data: {
        title: 'As an author, I want to schedule a post for future publication so that I can batch-write content in advance',
        description: 'A date-time picker in the publish dialog that queues the post. Scheduled posts are visible in a dashboard tab and can be edited or rescheduled before they go live.',
        acceptanceCriteria: ['Given I set a future date, when I click Schedule, then the post status changes to "Scheduled"', 'Given the scheduled time arrives, when the cron job fires, then the post is published automatically', 'Given I view my dashboard, when I click the Scheduled tab, then all queued posts are listed with their publish dates'],
        cardType: 'story', priority: 'could-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-1-1', type: 'storyCard', position: { x: 600, y: 226 }, data: {
        title: 'As a reader, I want a homepage feed so that I can see the latest published posts at a glance',
        description: 'A paginated reverse-chronological feed of post cards showing title, excerpt, author avatar, publish date, and reading time estimate.',
        acceptanceCriteria: ['Given I visit the homepage, when posts exist, then the 10 most recent posts are displayed as cards', 'Given I scroll to the bottom, when more posts exist, then the next page loads via infinite scroll or pagination', 'Given I click a post card, when the page navigates, then the full post content is displayed'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-1-2', type: 'storyCard', position: { x: 600, y: 527 }, data: {
        title: 'As a reader, I want to search posts by keyword so that I can find articles on a specific topic',
        description: 'Full-text search across post titles and bodies with highlighted keyword matches in the results list. Supports filtering results by tag.',
        acceptanceCriteria: ['Given I enter a search term, when results load, then matching posts are listed with keyword highlights', 'Given I filter by tag, when combined with a search term, then only posts matching both are shown', 'Given no posts match, when results render, then a helpful empty state suggests alternative search terms'],
        cardType: 'story', priority: 'should-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-2-1', type: 'storyCard', position: { x: 900, y: 226 }, data: {
        title: 'As a reader, I want to comment on posts so that I can share my thoughts and discuss with the author',
        description: 'Threaded comment section below each post. Comments support basic formatting (bold, italic, links). Author replies are visually highlighted.',
        acceptanceCriteria: ['Given I am logged in, when I submit a comment, then it appears at the bottom of the thread immediately', 'Given I click Reply on a comment, when I submit, then my reply is nested under the parent comment', 'Given the author replies, when the comment renders, then it shows a highlighted "Author" badge'],
        cardType: 'story', priority: 'must-have', estimate: 'L', status: 'not-started',
      } },
      { id: 'story-2-2-2', type: 'storyCard', position: { x: 900, y: 527 }, data: {
        title: 'As a reader, I want to bookmark posts so that I can save them for later reading',
        description: 'A bookmark icon on each post card and detail page. Bookmarked posts are accessible from a dedicated "Saved" page in the user profile.',
        acceptanceCriteria: ['Given I click the bookmark icon, when the action completes, then the icon fills in and the post is saved to my list', 'Given I visit my Saved page, when bookmarks exist, then all bookmarked posts are listed newest first', 'Given I click the bookmark icon again, when it toggles off, then the post is removed from my saved list'],
        cardType: 'story', priority: 'should-have', estimate: 'S', status: 'not-started',
      } },
    ],
    edges: [
      { id: 'edge-activity-1-step-1-1', source: 'activity-1', target: 'step-1-1' },
      { id: 'edge-activity-1-step-1-2', source: 'activity-1', target: 'step-1-2' },
      { id: 'edge-activity-2-step-2-1', source: 'activity-2', target: 'step-2-1' },
      { id: 'edge-activity-2-step-2-2', source: 'activity-2', target: 'step-2-2' },
      { id: 'edge-step-1-1-story-1-1-1', source: 'step-1-1', target: 'story-1-1-1' },
      { id: 'edge-step-1-1-story-1-1-2', source: 'step-1-1', target: 'story-1-1-2' },
      { id: 'edge-step-1-2-story-1-2-1', source: 'step-1-2', target: 'story-1-2-1' },
      { id: 'edge-step-1-2-story-1-2-2', source: 'step-1-2', target: 'story-1-2-2' },
      { id: 'edge-step-2-1-story-2-1-1', source: 'step-2-1', target: 'story-2-1-1' },
      { id: 'edge-step-2-1-story-2-1-2', source: 'step-2-1', target: 'story-2-1-2' },
      { id: 'edge-step-2-2-story-2-2-1', source: 'step-2-2', target: 'story-2-2-1' },
      { id: 'edge-step-2-2-story-2-2-2', source: 'step-2-2', target: 'story-2-2-2' },
    ],
    viewport: { x: 100, y: 50, zoom: 0.75 },
  },

  // ── Task Manager ──────────────────────────────────────────────────
  {
    name: 'Task Manager',
    description: 'Task organization, collaboration, and progress tracking',
    nodes: [
      { id: 'activity-1', type: 'activity', position: { x: 150, y: 0 }, data: { title: 'Manage Tasks', description: 'Create, organize, and prioritize work items', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 'activity-2', type: 'activity', position: { x: 750, y: 0 }, data: { title: 'Collaborate', description: 'Team coordination, assignments, and notifications', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 'step-1-1', type: 'step', position: { x: 0, y: 113 }, data: { title: 'Create Task', description: 'Define new work items with details', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-1-2', type: 'step', position: { x: 300, y: 113 }, data: { title: 'Organize', description: 'Categorize and visualize tasks on boards', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-1', type: 'step', position: { x: 600, y: 113 }, data: { title: 'Assign & Track', description: 'Delegate work and monitor progress', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-2', type: 'step', position: { x: 900, y: 113 }, data: { title: 'Notify', description: 'Keep the team informed of changes', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'story-1-1-1', type: 'storyCard', position: { x: 0, y: 226 }, data: {
        title: 'As a team member, I want to create a task with a title, description, and due date so that work is clearly defined',
        description: 'Task creation form with required title, optional rich-text description, due date picker, and priority selector. Task is saved immediately and appears in the inbox view.',
        acceptanceCriteria: ['Given I open the create dialog, when I fill in a title and click Save, then the task is created and visible in my task list', 'Given I set a due date, when the task is saved, then the due date badge appears on the task card', 'Given I leave the title empty, when I click Save, then a validation error prevents submission'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-1-1-2', type: 'storyCard', position: { x: 0, y: 539 }, data: {
        title: 'As a team member, I want to add a subtask checklist so that I can break down complex tasks into smaller steps',
        description: 'Inline checklist within a task detail view. Each subtask has a checkbox and text label. A progress bar shows completion percentage.',
        acceptanceCriteria: ['Given I open a task, when I click "Add subtask", then a new checklist item appears with a text input', 'Given I check off a subtask, when the checkbox is toggled, then the progress bar updates immediately', 'Given all subtasks are complete, when the last one is checked, then the progress bar shows 100% with a visual cue'],
        cardType: 'story', priority: 'should-have', estimate: 'S', status: 'not-started',
      } },
      { id: 'story-1-2-1', type: 'storyCard', position: { x: 300, y: 226 }, data: {
        title: 'As a team member, I want a Kanban board view so that I can visualize task status at a glance',
        description: 'Drag-and-drop board with customizable columns (e.g., To Do, In Progress, Done). Moving a card between columns updates its status automatically.',
        acceptanceCriteria: ['Given I open the board, when tasks exist, then they are displayed in their respective status columns', 'Given I drag a card to another column, when I drop it, then the task status updates and the card stays in the new column', 'Given I create a custom column, when I name it and save, then it appears on the board and I can drag tasks into it'],
        cardType: 'story', priority: 'must-have', estimate: 'L', status: 'not-started',
      } },
      { id: 'story-1-2-2', type: 'storyCard', position: { x: 300, y: 539 }, data: {
        title: 'As a team member, I want to tag tasks with labels and priority so that I can filter and sort my work',
        description: 'Color-coded label chips and a priority field (Low, Medium, High, Urgent) on each task. Board and list views support filtering by label or priority.',
        acceptanceCriteria: ['Given I edit a task, when I add a label, then a colored chip appears on the task card', 'Given I set priority to High, when viewing the board, then a priority icon is visible on the card', 'Given I filter by a label, when the filter is active, then only tasks with that label are shown'],
        cardType: 'story', priority: 'should-have', estimate: 'S', status: 'not-started',
      } },
      { id: 'story-2-1-1', type: 'storyCard', position: { x: 600, y: 226 }, data: {
        title: 'As a team lead, I want to assign tasks to team members so that everyone knows what they are responsible for',
        description: 'Assignee picker dropdown in the task detail view showing team member avatars and names. Assigned tasks appear in the assignee\'s personal dashboard.',
        acceptanceCriteria: ['Given I open a task, when I click the assignee field, then a dropdown of team members appears', 'Given I select a member, when the assignment is saved, then their avatar appears on the task card', 'Given I am assigned a task, when I open my dashboard, then the task is listed under "Assigned to me"'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-1-2', type: 'storyCard', position: { x: 600, y: 826 }, data: {
        title: 'As a team member, I want to track time spent on tasks so that we can report on effort and improve estimates',
        description: 'Built-in timer with start/stop controls on the task detail page and manual time entry fallback. Time logs are aggregated per task and per user.',
        acceptanceCriteria: ['Given I click Start Timer, when the timer is running, then elapsed time is displayed on the task', 'Given I click Stop, when the timer pauses, then the time entry is saved to the task log', 'Given I prefer manual entry, when I input hours and minutes, then the time is added to the task total'],
        cardType: 'story', priority: 'could-have', estimate: 'L', status: 'not-started',
      } },
      { id: 'story-2-2-1', type: 'storyCard', position: { x: 900, y: 226 }, data: {
        title: 'As a team member, I want to receive email notifications for assignments and due dates so that I never miss important updates',
        description: 'Transactional emails for task assignment, approaching due dates (24h before), and overdue tasks. Users can configure which notifications they receive.',
        acceptanceCriteria: ['Given I am assigned a task, when the assignment is saved, then I receive an email within 2 minutes', 'Given a task is due in 24 hours, when the reminder fires, then an email is sent with the task title and link', 'Given I disable assignment notifications, when a task is assigned, then no email is sent for that event'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-2-2', type: 'storyCard', position: { x: 900, y: 826 }, data: {
        title: 'As a team lead, I want a Slack integration so that task updates are posted to our team channel automatically',
        description: 'OAuth-based Slack app that posts task creation, completion, and overdue alerts to a configured channel. Supports slash commands for quick task creation.',
        acceptanceCriteria: ['Given Slack is connected, when a task is completed, then a message is posted to the configured channel', 'Given I type /task Create deploy script, when I submit, then a new task is created and confirmed in Slack', 'Given I disconnect Slack, when the integration is removed, then no further messages are posted'],
        cardType: 'story', priority: 'could-have', estimate: 'XL', status: 'not-started',
      } },
    ],
    edges: [
      { id: 'edge-activity-1-step-1-1', source: 'activity-1', target: 'step-1-1' },
      { id: 'edge-activity-1-step-1-2', source: 'activity-1', target: 'step-1-2' },
      { id: 'edge-activity-2-step-2-1', source: 'activity-2', target: 'step-2-1' },
      { id: 'edge-activity-2-step-2-2', source: 'activity-2', target: 'step-2-2' },
      { id: 'edge-step-1-1-story-1-1-1', source: 'step-1-1', target: 'story-1-1-1' },
      { id: 'edge-step-1-1-story-1-1-2', source: 'step-1-1', target: 'story-1-1-2' },
      { id: 'edge-step-1-2-story-1-2-1', source: 'step-1-2', target: 'story-1-2-1' },
      { id: 'edge-step-1-2-story-1-2-2', source: 'step-1-2', target: 'story-1-2-2' },
      { id: 'edge-step-2-1-story-2-1-1', source: 'step-2-1', target: 'story-2-1-1' },
      { id: 'edge-step-2-1-story-2-1-2', source: 'step-2-1', target: 'story-2-1-2' },
      { id: 'edge-step-2-2-story-2-2-1', source: 'step-2-2', target: 'story-2-2-1' },
      { id: 'edge-step-2-2-story-2-2-2', source: 'step-2-2', target: 'story-2-2-2' },
    ],
    viewport: { x: 100, y: 50, zoom: 0.75 },
  },

  // ── Fitness App ───────────────────────────────────────────────────
  {
    name: 'Fitness App',
    description: 'Workout tracking, goals, and social features',
    nodes: [
      { id: 'activity-1', type: 'activity', position: { x: 150, y: 0 }, data: { title: 'Work Out', description: 'Users find, perform, and log exercises', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 'activity-2', type: 'activity', position: { x: 750, y: 0 }, data: { title: 'Track Progress', description: 'Monitor stats, set goals, and earn achievements', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 'step-1-1', type: 'step', position: { x: 0, y: 113 }, data: { title: 'Choose Workout', description: 'Browse or build a workout routine', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-1-2', type: 'step', position: { x: 300, y: 113 }, data: { title: 'Log Exercise', description: 'Record sets, reps, and cardio sessions', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-1', type: 'step', position: { x: 600, y: 113 }, data: { title: 'View Stats', description: 'Review performance charts and records', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'step-2-2', type: 'step', position: { x: 900, y: 113 }, data: { title: 'Set Goals', description: 'Define targets and track streaks', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'story-1-1-1', type: 'storyCard', position: { x: 0, y: 226 }, data: {
        title: 'As a user, I want to browse a workout library so that I can find routines that match my fitness level',
        description: 'Categorized exercise library with filters for muscle group, difficulty, equipment, and duration. Each workout shows a preview with estimated calories burned.',
        acceptanceCriteria: ['Given I open the library, when workouts load, then they are grouped by category with thumbnail previews', 'Given I filter by difficulty, when I select "Beginner", then only beginner-level workouts are shown', 'Given I tap a workout, when the detail view opens, then exercises, sets, and estimated duration are listed'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-1-1-2', type: 'storyCard', position: { x: 0, y: 539 }, data: {
        title: 'As a user, I want to build a custom workout so that I can tailor routines to my personal goals',
        description: 'Workout builder where users pick exercises from the library, set rep/set targets, reorder via drag-and-drop, and save as a reusable template.',
        acceptanceCriteria: ['Given I open the builder, when I search for an exercise, then matching exercises appear and can be added', 'Given I add exercises, when I drag to reorder, then the sequence updates and persists when saved', 'Given I save the workout, when I return to the library, then my custom routine appears under "My Workouts"'],
        cardType: 'story', priority: 'should-have', estimate: 'L', status: 'not-started',
      } },
      { id: 'story-1-2-1', type: 'storyCard', position: { x: 300, y: 226 }, data: {
        title: 'As a user, I want to log sets, reps, and weight so that I have an accurate record of every workout',
        description: 'In-workout logging screen with quick-entry number pads for weight and reps, a built-in rest timer between sets, and the ability to skip or add extra sets.',
        acceptanceCriteria: ['Given I start a workout, when an exercise appears, then I can enter weight and reps for each set', 'Given I complete a set, when I tap Done, then a configurable rest timer starts automatically', 'Given I finish the workout, when I tap Complete, then all logged data is saved and a summary is shown'],
        cardType: 'story', priority: 'must-have', estimate: 'L', status: 'not-started',
      } },
      { id: 'story-1-2-2', type: 'storyCard', position: { x: 300, y: 840 }, data: {
        title: 'As a runner, I want GPS-tracked runs so that I can see my route, pace, and distance on a map',
        description: 'Real-time GPS tracking during outdoor runs with a live map, current pace display, and distance counter. After the run, a detailed map with pace splits is saved.',
        acceptanceCriteria: ['Given I start a run, when GPS locks, then a live map with my moving position is displayed', 'Given the run is in progress, when I check the screen, then current pace and total distance are updated every second', 'Given I finish the run, when the summary loads, then a map of my route with color-coded pace splits is shown'],
        cardType: 'story', priority: 'could-have', estimate: 'XL', status: 'not-started',
      } },
      { id: 'story-2-1-1', type: 'storyCard', position: { x: 600, y: 226 }, data: {
        title: 'As a user, I want to see weekly and monthly charts so that I can understand my training trends',
        description: 'Dashboard with interactive charts showing workout frequency, total volume (sets x reps x weight), and muscle group distribution over selectable time ranges.',
        acceptanceCriteria: ['Given I open the stats page, when data exists, then a weekly workout frequency bar chart is displayed', 'Given I switch to monthly view, when the chart updates, then volume trends over the past 12 weeks are shown', 'Given I tap a data point, when the detail popover opens, then the specific workout details for that day are listed'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-1-2', type: 'storyCard', position: { x: 600, y: 539 }, data: {
        title: 'As a user, I want a personal records board so that I can celebrate strength milestones',
        description: 'Dedicated PR page listing the heaviest weight or best time for each exercise. New PRs trigger a congratulatory animation and badge in the workout summary.',
        acceptanceCriteria: ['Given I log a new max weight, when it exceeds my previous record, then a "New PR!" animation plays', 'Given I visit the PR board, when records exist, then each exercise shows the best value and the date achieved', 'Given I tap a PR entry, when the detail opens, then the full set/rep history for that exercise is displayed'],
        cardType: 'story', priority: 'should-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-2-1', type: 'storyCard', position: { x: 900, y: 226 }, data: {
        title: 'As a user, I want to set weekly workout goals so that I stay motivated and consistent',
        description: 'Goal setting screen where users define target workout days per week. A home screen ring indicator shows progress, and streaks are tracked for consecutive goal-hitting weeks.',
        acceptanceCriteria: ['Given I set a goal of 4 days/week, when I log a workout, then the progress ring fills proportionally', 'Given I meet my weekly goal, when the week ends, then my streak counter increments and a celebration appears', 'Given I miss a week, when the streak breaks, then the counter resets and a motivational prompt is shown'],
        cardType: 'story', priority: 'must-have', estimate: 'M', status: 'not-started',
      } },
      { id: 'story-2-2-2', type: 'storyCard', position: { x: 900, y: 840 }, data: {
        title: 'As a user, I want to join social fitness challenges so that I can compete with friends and stay accountable',
        description: 'Challenge system where users create or join time-boxed challenges (e.g., "Most workouts in 30 days"). A live leaderboard ranks participants by the challenge metric.',
        acceptanceCriteria: ['Given I create a challenge, when I set the rules and invite friends, then they receive a push notification to join', 'Given a challenge is active, when I view it, then a live leaderboard shows all participants ranked by progress', 'Given the challenge ends, when results are final, then the winner is announced and badges are awarded to all participants'],
        cardType: 'story', priority: 'could-have', estimate: 'XL', status: 'not-started',
      } },
    ],
    edges: [
      { id: 'edge-activity-1-step-1-1', source: 'activity-1', target: 'step-1-1' },
      { id: 'edge-activity-1-step-1-2', source: 'activity-1', target: 'step-1-2' },
      { id: 'edge-activity-2-step-2-1', source: 'activity-2', target: 'step-2-1' },
      { id: 'edge-activity-2-step-2-2', source: 'activity-2', target: 'step-2-2' },
      { id: 'edge-step-1-1-story-1-1-1', source: 'step-1-1', target: 'story-1-1-1' },
      { id: 'edge-step-1-1-story-1-1-2', source: 'step-1-1', target: 'story-1-1-2' },
      { id: 'edge-step-1-2-story-1-2-1', source: 'step-1-2', target: 'story-1-2-1' },
      { id: 'edge-step-1-2-story-1-2-2', source: 'step-1-2', target: 'story-1-2-2' },
      { id: 'edge-step-2-1-story-2-1-1', source: 'step-2-1', target: 'story-2-1-1' },
      { id: 'edge-step-2-1-story-2-1-2', source: 'step-2-1', target: 'story-2-1-2' },
      { id: 'edge-step-2-2-story-2-2-1', source: 'step-2-2', target: 'story-2-2-1' },
      { id: 'edge-step-2-2-story-2-2-2', source: 'step-2-2', target: 'story-2-2-2' },
    ],
    viewport: { x: 100, y: 50, zoom: 0.75 },
  },
];
