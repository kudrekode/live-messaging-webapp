# Live Messaging WebApp Project:

This is a personal project to demonstrate my abilities using React + Typescript to create a full stack application that connects to an express server and an SQL database. In summary it provides two roles, admin and a normal user whoa re able to chat through pusher integrated modals. The admin can create and delete chat rooms and users whereas the user cannot. It should be fairly straight forward how to add more roles and routes.

Some of the concepts used here have come from another project that I deployed with Vercel with other features. I just wanted to use this as a scratch template to demonstrate basic full stack skills and real time messaging API integrations. Unfortunately this app is not currently deployed due to cost of keeping a database running properly. However extensive notes/comments are throughout this code to help users understand what is happening. 

Feel free to clone and use this project as a template for any messaging web apps.

## Methodology:
### Database Design:
I havent really implemented a proper db for this but I have put an example postgreSQL schema since when part of this project was deployed it was using Supabase (a free(mostly) postreSQL hosting site) and so the express server is set up for postreSQL syntax rather than typical SQL. This is easily rectified by going into the /routes within /express/routes/route.


### Express Server (API Route Design):
I chose to use express.js since it is the middleware framework I have the most experience in and could demonstrate some fundamental security concepts such as JWT sessions. This helps ensure that users can have persistent sessions which are secure. Moreover, when creating an application with different roles, such as admins and normal users, the JWT can help ensure certain routes are protected. 

The server uses Sequelize ORM with SQLite for this showcase purpose but if this was in production a more streamlined connection with a running server would be preferable to me (or at least in addition). 

Other security features include bcrypt for hashing/encryption, https enforcement, helmet for secure headers (very important with JWTs being sent over them) and CORS policies to restrict or whitelist certain IP addresses (annoying with vercels dynamic ips!!!). The custom middleware essentially allows for this verification of identity and RBAC.


### Front End Design:
Notably no CSS or tailwind or any stylign has actually been done to this project as the purpose of this project was to get me back to grips with using more complex state management and hooks within react and connecting RESTful APIs (i.e., logic not design oriented).

We use async functions to speak to our express server API (i installed axios but didnt actually use but the imports are there incase others want to use Axios instead - i would recommend). 

Basic structure has a login page which receives the JWT token via https only (so less chance of XSS) and then pushes to the correct role page i.e., user or admin. The pages themselves are super simple with showing the messages receieved from the db but once clikcing on a message we use useState to track opening a chat modal in which we then use pusher to send real time messages. 

There is only one modal component because we can pass the role as props to the modal so that the modal has different behaviours depending on whether a manager or not. 
