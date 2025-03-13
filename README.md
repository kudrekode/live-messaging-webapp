# Live Messaging WebApp Project:

This is a personal project to demonstrate my abilities using React + Typescript to create a full stack application that connects to an express server and an SQL database. In summary it provides two roles, admin and a normal user whoa re able to chat through pusher integrated modals. The admin can create and delete chat rooms and users whereas the user cannot. It should be fairly straight forward how to add more roles and routes.

Some of the concepts used here have come from another project that I deployed with Vercel with other features. I just wanted to use this as a scratch template to demonstrate basic full stack skills and real time messaging API integrations. Unfortunately this app is not currently deployed due to cost of keeping a database running properly. However extensive notes/comments are throughout this code to help users understand what is happening. 

Feel free to clone and use this project as a template for any messaging web apps.

## Methodology:
### Database Design:
I chose to use 

### Express Server (API Route Design):
I chose to use express.js since it is the middleware framework I have the most experience in and could demonstrate some fundamental security concepts such as JWT sessions. This helps ensure that users can have persistent sessions which are secure. Moreover, when creating an application with different roles, such as admins and normal users, the JWT can help ensure certain routes are protected. 



### Front End Design:
I began this section by initiating a blank react/vite compiled build. 
