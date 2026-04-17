import mongoose from 'mongoose';
import { User, Review, Follow } from './models/index.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/moventia', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const users = await User.find();
  console.log('Users count:', users.length);
  
  const reviews = await Review.find();
  console.log('Reviews count:', reviews.length);
  
  const follows = await Follow.find();
  console.log('Follows count:', follows.length);
  
  process.exit(0);
}
run();
