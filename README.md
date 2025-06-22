CoffeeMaster - Coffee Shop Management System
CoffeeMaster is a user-friendly system that helps coffee shops manage everything from orders to inventory. It's designed to make daily operations smoother for staff, whether they're taking orders at the counter or managing stock in the back.

What It Does
Easy Order Taking – A simple, touch-friendly POS system for quick order entry and receipt printing.

Smart Inventory Tracking – Automatically updates stock levels as orders come in and warns when supplies run low.

Menu & Recipe Control – Easily update drinks, ingredients, and prices.

Staff Management – Different access levels for cashiers, managers, and admins.

Reports & Insights – See sales trends, track inventory use, and make better business decisions.

How It Works
Frontend – Built with React.js for a fast, modern interface.

Backend – Runs on Node.js with Express for reliability.

Databases – Uses MySQL for secure transaction data (like sales) and MongoDB for flexible stuff (like recipes and logs).

Setup Guide
Install Dependencies – Make sure you have Node.js, MySQL, and MongoDB installed.

Clone & Configure –

bash
git clone https://github.com/yourusername/coffeemaster.git  
cd coffeemaster  
Set Up the Server –

bash
cd server  
npm install  
cp .env.example .env  # Fill in your database details  
npm run build  
npm start  
Launch the Frontend –

bash
cd ../client  
npm install  
npm start  
Log In – Open http://localhost:3000 and use:

Admin: admin / admin123

Why It’s Useful
Saves Time – No more manual stock tracking or messy spreadsheets.

Reduces Errors – Automatic calculations mean fewer mistakes.

Grows with You – Works for small cafes or busy shops.

Perfect for coffee shop owners who want a simple but powerful tool to handle daily operations.

License
This project is licensed under the MIT License - see the LICENSE file for details.
