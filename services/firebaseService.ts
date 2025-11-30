import { User, WorkoutPlan, NutritionPlan, WorkoutSession, ChatMessage, SocialPost, Song, Media, Comment, Story, Notification, MarketplaceListing } from '../types.ts';

// --- MOCK DATA GENERATION ---

// Helper function to generate users
const generateUsers = (): { [key: string]: User } => {
  const users: { [key: string]: User } = {
    'user_1': { id: 'user_1', name: 'Khun Hoang', username: 'khun_hoang_fit', profilePictureUrl: 'https://i.pravatar.cc/150?u=user_1', coverPhotoUrl: 'https://picsum.photos/seed/cover1/1000/400', bio: 'Fitness enthusiast. Following my dreams.', followers: 1250, following: 300, age: 29, gender: 'male' },
    'user_2': { id: 'user_2', name: 'Jessica', username: 'jess_lifts', profilePictureUrl: 'https://i.pravatar.cc/150?u=user_2', coverPhotoUrl: 'https://picsum.photos/seed/cover2/1000/400', bio: 'Professional bodybuilder and coach.', followers: 10500, following: 150, age: 32, gender: 'female' },
    'user_3': { id: 'user_3', name: 'Mike', username: 'mike_runs', profilePictureUrl: 'https://i.pravatar.cc/150?u=user_3', coverPhotoUrl: 'https://picsum.photos/seed/cover3/1000/400', bio: 'Marathon runner. Pushing the limits.', followers: 500, following: 50, age: 28, gender: 'male' },
    'user_4': { id: 'user_4', name: 'Hanh Fastcargo', username: 'hanhfast', profilePictureUrl: 'https://i.pravatar.cc/150?u=user_4', coverPhotoUrl: 'https://picsum.photos/seed/cover4/1000/400', bio: 'Yoga instructor.', followers: 2300, following: 400, age: 26, gender: 'female' },
    'user_5': { id: 'user_5', name: 'Luong Van Thuy', username: 'thuyvan', profilePictureUrl: 'https://i.pravatar.cc/150?u=user_5', coverPhotoUrl: 'https://picsum.photos/seed/cover5/1000/400', bio: 'Crossfit lover.', followers: 800, following: 200, age: 30, gender: 'female' },
    'user_6': { id: 'user_6', name: 'Pho Viet Com', username: 'phoviet', profilePictureUrl: 'https://i.pravatar.cc/150?u=user_6', coverPhotoUrl: 'https://picsum.photos/seed/cover6/1000/400', bio: 'Foodie and fitness.', followers: 4400, following: 100, age: 35, gender: 'male' },
  };

  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Jamie', 'Morgan', 'Cameron', 'Avery', 'Skyler'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const bios = ['Just trying to be better than yesterday.', 'Sweat is just fat crying.', 'On a journey to a healthier me.', 'Runner, lifter, eater.', 'Finding my balance.'];

  for (let i = 7; i <= 100; i++) {
    const id = `user_${i}`;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = (Math.random() > 0.5 ? 'male' : 'female') as 'male' | 'female';
    users[id] = {
      id,
      name: `${firstName} ${lastName}`,
      username: `${firstName.toLowerCase()}${i}`,
      profilePictureUrl: `https://i.pravatar.cc/150?u=${id}`,
      coverPhotoUrl: `https://picsum.photos/seed/cover${id}/1000/400`,
      bio: bios[Math.floor(Math.random() * bios.length)],
      followers: Math.floor(Math.random() * 2000),
      following: Math.floor(Math.random() * 500),
      age: 20 + Math.floor(Math.random() * 20),
      gender
    };
  }
  return users;
};

const MOCK_USERS: { [key: string]: User } = generateUsers();
const USER_IDS = Object.keys(MOCK_USERS);

const generateFriendships = (): Record<string, string[]> => {
    const friendships: Record<string, string[]> = {};
    USER_IDS.forEach(userId => {
        if (!friendships[userId]) {
            friendships[userId] = [];
        }
        const numberOfFriends = Math.floor(Math.random() * 10) + 2; // 2 to 12 friends
        while (friendships[userId].length < numberOfFriends) {
            const potentialFriendId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
            if (potentialFriendId !== userId && !friendships[userId].includes(potentialFriendId)) {
                friendships[userId].push(potentialFriendId);
                // Make friendship reciprocal
                if (!friendships[potentialFriendId]) {
                    friendships[potentialFriendId] = [];
                }
                if (!friendships[potentialFriendId].includes(userId)) {
                    friendships[potentialFriendId].push(userId);
                }
            }
        }
    });
    return friendships;
};

const MOCK_FRIENDSHIPS = generateFriendships();

const MOCK_SONGS: { [key: string]: Song } = {
    'song_1': { id: 'song_1', title: 'Eye of the Tiger', artist: 'Survivor', albumArtUrl: 'https://picsum.photos/seed/song1/100/100' },
    'song_2': { id: 'song_2', title: 'Gonna Fly Now', artist: 'Bill Conti', albumArtUrl: 'https://picsum.photos/seed/song2/100/100' }
};

let MOCK_POSTS: SocialPost[] = [
    { id: 'post_video_1', author: MOCK_USERS['user_5'], timestamp: new Date(Date.now() - 500000000).toISOString(), content: "New promo just dropped! Check out the energy. #gymlife #promo", media: [{ id: 'vid_new_1', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_1.mp4' }], likes: ['user_1', 'user_2', 'user_3'], comments: [], privacy: 'public' },
    { id: 'post_video_2', author: MOCK_USERS['user_6'], timestamp: new Date(Date.now() - 510000000).toISOString(), content: "Push your limits! Trailer for our new program. #fitnessmotivation", media: [{ id: 'vid_new_2', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_2.mp4' }], likes: ['user_4'], comments: [], privacy: 'public' },
    { id: 'post_video_3', author: MOCK_USERS['user_7'], timestamp: new Date(Date.now() - 520000000).toISOString(), content: "The grind never stops. #workouttrailer", media: [{ id: 'vid_new_3', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_1.mp4' }], likes: ['user_1'], comments: [], privacy: 'public' },
    { id: 'post_video_4', author: MOCK_USERS['user_8'], timestamp: new Date(Date.now() - 530000000).toISOString(), content: "Get inspired for your next session!", media: [{ id: 'vid_new_4', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_2.mp4' }], likes: [], comments: [], privacy: 'public' },
    { id: 'post_video_5', author: MOCK_USERS['user_9'], timestamp: new Date(Date.now() - 540000000).toISOString(), content: "Strength comes from within. Watch our new short film.", media: [{ id: 'vid_new_5', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_1.mp4' }], likes: ['user_2', 'user_5'], comments: [], privacy: 'public' },
    { id: 'post_video_6', author: MOCK_USERS['user_10'], timestamp: new Date(Date.now() - 550000000).toISOString(), content: "Unleash your potential.", media: [{ id: 'vid_new_6', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_2.mp4' }], likes: ['user_1', 'user_3', 'user_4'], comments: [], privacy: 'public' },
    { id: 'post_video_7', author: MOCK_USERS['user_11'], timestamp: new Date(Date.now() - 560000000).toISOString(), content: "What's your motivation? #gymtrailer", media: [{ id: 'vid_new_7', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_1.mp4' }], likes: ['user_1'], comments: [], privacy: 'public' },
    { id: 'post_video_8', author: MOCK_USERS['user_12'], timestamp: new Date(Date.now() - 570000000).toISOString(), content: "The ultimate fitness experience is here.", media: [{ id: 'vid_new_8', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_2.mp4' }], likes: ['user_1', 'user_5'], comments: [], privacy: 'public' },
    { id: 'post_video_9', author: MOCK_USERS['user_13'], timestamp: new Date(Date.now() - 580000000).toISOString(), content: "Coming soon... #teasertrailer", media: [{ id: 'vid_new_9', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_1.mp4' }], likes: [], comments: [], privacy: 'public' },
    { id: 'post_video_10', author: MOCK_USERS['user_14'], timestamp: new Date(Date.now() - 590000000).toISOString(), content: "Be stronger than your excuses. #motivation", media: [{ id: 'vid_new_10', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_2.mp4' }], likes: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'], comments: [], privacy: 'public' },
    { id: 'post_1', author: MOCK_USERS['user_2'], timestamp: new Date(Date.now() - 3600000).toISOString(), content: "Just finished a killer leg day! Feeling the burn 🔥 #legday #fitness", media: [{ id: 'media_1', type: 'image', url: 'https://picsum.photos/seed/post1/600/800' }], likes: ['user_1', 'user_3'], comments: [{id: 'c1', author: MOCK_USERS['user_1'], content: 'Great work!', timestamp: new Date().toISOString(), taggedUsers: []}], privacy: 'public' },
    { id: 'post_2', author: MOCK_USERS['user_3'], timestamp: new Date(Date.now() - 86400000).toISOString(), content: "Morning run with a view. Can't beat it.", media: [{ id: 'media_2', type: 'image', url: 'https://picsum.photos/seed/post2/600/600' }], likes: [], comments: [], privacy: 'public' },
    { id: 'post_3', author: MOCK_USERS['user_1'], timestamp: new Date(Date.now() - 172800000).toISOString(), content: "New PR on the bench press today! 100kg club!", media: [], likes: ['user_2'], comments: [], privacy: 'friends', feeling: 'strong 💪' },
    { id: 'post_4', author: MOCK_USERS['user_1'], timestamp: new Date(Date.now() - 259200000).toISOString(), content: "Workout Motivation", media: [{id: 'vid1', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_1.mp4'}], likes: [], comments: [], privacy: 'public', attachedMusic: MOCK_SONGS['song_1'] },
    { id: 'post_5', author: MOCK_USERS['user_1'], timestamp: new Date(Date.now() - 345600000).toISOString(), content: "Believe you can and you're halfway there.", media: [], likes: [], comments: [], privacy: 'public', backgroundColor: 'linear-gradient(to right, #6a11cb, #2575fc)' },
    { id: 'post_6', author: MOCK_USERS['user_4'], timestamp: new Date(Date.now() - 445600000).toISOString(), content: "Yoga time!", media: [{id: 'vid2', type: 'video', url: 'https://storage.googleapis.com/generative-ai-docs/videos/video_gen_promo_2.mp4'}], likes: ['user_1'], comments: [], privacy: 'public' },
];

// Add more posts from generated users
for(let i = 7; i <= 50; i++) {
    const user = MOCK_USERS[`user_${i}`];
    MOCK_POSTS.push({
        id: `post_${i}`,
        author: user,
        timestamp: new Date(Date.now() - (i * 100000000)).toISOString(),
        content: `Having a great workout today. #motivation`,
        media: [{id: `media_${i}`, type: 'image', url: `https://picsum.photos/seed/post${i}/600/600`}],
        likes: [],
        comments: [],
        privacy: 'public'
    });
}

const generateAllStories = (): Story[] => {
    const stories: Story[] = [];
    const userIdsWithStories = [...USER_IDS]
      .filter(id => id !== 'user_1') // Exclude the main user who has the 'create' button
      .sort(() => 0.5 - Math.random()) // Shuffle the array to get random users
      .slice(0, 20); // Take the first 20 random users to have stories

    userIdsWithStories.forEach((userId, index) => {
      const user = MOCK_USERS[userId];
      if (user) {
        stories.push({
          id: `story_gen_${index}`,
          user,
          imageUrl: `https://picsum.photos/seed/story${index}/300/500`,
        });
      }
    });
    return stories;
};


let MOCK_STORIES: Story[] = [
    // The first story is always the "Create Story" prompt for the current user
    { id: 'story_create', user: MOCK_USERS['user_1'], imageUrl: MOCK_USERS['user_1'].profilePictureUrl },
    // Now, spread the dynamically generated stories
    ...generateAllStories()
];

let MOCK_WORKOUT_PLANS: WorkoutPlan[] = [
    { 
        id: 'plan_0', 
        name: 'Full Body Strength', 
        schedule: { day: 'Monday', session: 'Anytime', startTime: '' }, 
        notes: 'A foundational plan for building overall strength. Focus on compound movements.', 
        media: [{id: 'm0', type: 'image', url: 'https://picsum.photos/seed/plan0/400/200'}], 
        category: 'Strength',
        difficulty: 'Intermediate',
        duration: 50,
        caloriesBurned: 400,
        coach: MOCK_USERS['user_2'],
        exercises: [ 
            {id: 'ex_sq', name: 'Barbell Squats', sets: 4, reps: '10-12 reps', estimatedTime: 180, restTime: 120, notes: 'Keep your chest up and back straight. Go to at least parallel.', media: [{id:'ex_sq_m', type:'image', url:'https://picsum.photos/seed/ex_sq/200/200'}], equipment: 'Barbell, Squat Rack'},
            {id: 'ex_bp', name: 'Bench Press', sets: 4, reps: '10-12 reps', estimatedTime: 120, restTime: 90, notes: 'Tuck your elbows slightly. Control the weight down.', media: [{id:'ex_bp_m', type:'image', url:'https://picsum.photos/seed/ex_bp/200/200'}], equipment: 'Barbell, Bench'},
            {id: 'ex_dl', name: 'Deadlifts', sets: 3, reps: '10-12 reps', estimatedTime: 180, restTime: 180, notes: 'Keep a neutral spine. Drive with your legs.', media: [{id:'ex_dl_m', type:'image', url:'https://picsum.photos/seed/ex_dl/200/200'}], equipment: 'Barbell'},
            {id: 'ex_ohp', name: 'Overhead Press', sets: 4, reps: '10-12 reps', estimatedTime: 120, restTime: 90, notes: 'Brace your core. Don\'t use leg drive.', media: [{id:'ex_ohp_m', type:'image', url:'https://picsum.photos/seed/ex_ohp/200/200'}], equipment: 'Barbell'},
            {id: 'ex_row', name: 'Bent-Over Rows', sets: 4, reps: '10-15 reps', estimatedTime: 120, restTime: 75, notes: 'Pull the bar to your lower chest.', media: [{id:'ex_row_m', type:'image', url:'https://picsum.photos/seed/ex_row/200/200'}], equipment: 'Barbell'}
        ] 
    },
    { 
        id: 'plan_1', 
        name: 'Confidence Carnival', 
        schedule: { day: 'Tuesday', session: 'Afternoon', startTime: '16:00' }, 
        notes: 'Focus on mind-muscle connection. Hit the chest from all angles.', 
        media: [{id: 'm1', type: 'image', url: 'https://picsum.photos/seed/plan1/400/200'}], 
        category: 'Strength',
        difficulty: 'Advanced',
        duration: 35,
        caloriesBurned: 320,
        coach: MOCK_USERS['user_4'],
        exercises: [ 
            {id: 'ex1', name: 'Standing Arm Circles', sets: 3, reps: '30 seconds', estimatedTime: 30, restTime: 10, notes: 'Warm up the shoulders.', media: [{id:'ex1_m', type:'image', url:'https://picsum.photos/seed/ex1/200/200'}], equipment: 'Bodyweight'},
            {id: 'ex2', name: 'Dynamic Chest Stretch', sets: 3, reps: '30 seconds', estimatedTime: 30, restTime: 10, notes: 'Open up the chest.', media: [{id:'ex2_m', type:'image', url:'https://picsum.photos/seed/ex2/200/200'}], equipment: 'Bodyweight'},
            {id: 'ex3', name: 'Dumbbell Bench Press', sets: 4, reps: '10-12 reps', estimatedTime: 120, restTime: 75, notes: 'Focus on the upper chest squeeze.', media: [{id:'ex3_m', type:'image', url:'https://picsum.photos/seed/ex3/200/200'}], equipment: '15kg Dumbbells'},
            {id: 'ex_fly', name: 'Incline Dumbbell Flys', sets: 3, reps: '12-15 reps', estimatedTime: 120, restTime: 60, notes: 'Focus on a wide stretch and controlled movement.', media: [{id:'ex_fly_m', type:'image', url:'https://picsum.photos/seed/exfly/200/200'}], equipment: '10kg Dumbbells'},
            {id: 'ex4', name: 'Push-ups', sets: 4, reps: 'To Failure', estimatedTime: 60, restTime: 60, notes: 'Keep your body in a straight line.', media: [{id:'ex4_m', type:'image', url:'https://picsum.photos/seed/ex4/200/200'}], equipment: 'Bodyweight'}
        ] 
    },
    { 
        id: 'plan_2', 
        name: 'Groove & Gains Time', 
        schedule: { day: 'Wednesday', session: 'Morning', startTime: '09:00' }, 
        notes: 'A fun, full-body workout with a focus on core strength.', 
        media: [{id: 'm2', type: 'image', url: 'https://picsum.photos/seed/plan2/400/200'}], 
        category: 'Mixed',
        difficulty: 'Intermediate',
        duration: 40,
        caloriesBurned: 380,
        coach: MOCK_USERS['user_3'],
        exercises: [ 
            {id: 'ex_gs', name: 'Goblet Squats', sets: 4, reps: '10-15 reps', estimatedTime: 120, restTime: 60, notes: 'Keep the kettlebell close to your chest.', media: [{id:'ex_gs_m', type:'image', url:'https://picsum.photos/seed/ex_gs/200/200'}], equipment: '16kg Kettlebell'},
            {id: 'ex5', name: 'Kettlebell Swings', sets: 4, reps: '15 reps', estimatedTime: 120, restTime: 60, notes: 'Use your hips, not your arms.', media: [{id:'ex5_m', type:'image', url:'https://picsum.photos/seed/ex5/200/200'}], equipment: '16kg Kettlebell'},
            {id: 'ex_rt', name: 'Russian Twists', sets: 3, reps: '15-20 reps', estimatedTime: 60, restTime: 45, notes: 'Keep your feet off the ground for more challenge.', media: [{id:'ex_rt_m', type:'image', url:'https://picsum.photos/seed/ex_rt/200/200'}], equipment: 'Bodyweight'},
            {id: 'ex6', name: 'Plank', sets: 3, reps: '60 seconds', estimatedTime: 60, restTime: 45, notes: 'Keep your back flat.', media: [{id:'ex6_m', type:'image', url:'https://picsum.photos/seed/ex6/200/200'}], equipment: 'Bodyweight'},
        ] 
    },
    { 
        id: 'plan_3', 
        name: 'The FUN-ctional Flow', 
        schedule: { day: 'Friday', session: 'Evening', startTime: '18:00' }, 
        notes: 'Improve your flexibility and mobility with this relaxing flow.', 
        media: [{id: 'm3', type: 'image', url: 'https://picsum.photos/seed/plan3/400/200'}], 
        category: 'Flexibility',
        difficulty: 'Beginner',
        duration: 20,
        caloriesBurned: 100,
        coach: MOCK_USERS['user_4'],
        exercises: [ 
            {id: 'ex_cc', name: 'Cat-Cow Stretch', sets: 3, reps: '30 seconds', estimatedTime: 30, restTime: 20, notes: 'Flow with your breath.', media: [{id:'ex_cc_m', type:'image', url:'https://picsum.photos/seed/ex_cc/200/200'}], equipment: 'Yoga Mat'},
            {id: 'ex7', name: 'Downward Dog', sets: 3, reps: '30 seconds hold', estimatedTime: 30, restTime: 30, notes: 'Press through your palms.', media: [{id:'ex7_m', type:'image', url:'https://picsum.photos/seed/ex7/200/200'}], equipment: 'Yoga Mat'},
            {id: 'ex_cp', name: 'Pigeon Pose', sets: 3, reps: '30 seconds per side', estimatedTime: 60, restTime: 20, notes: 'Keep hips square.', media: [{id:'ex_cp_m', type:'image', url:'https://picsum.photos/seed/ex_cp/200/200'}], equipment: 'Yoga Mat'},
            {id: 'ex_ch', name: 'Child\'s Pose', sets: 3, reps: '60 seconds hold', estimatedTime: 60, restTime: 30, notes: 'Relax and breathe deeply.', media: [{id:'ex_ch_m', type:'image', url:'https://picsum.photos/seed/ex_ch/200/200'}], equipment: 'Yoga Mat'}
        ] 
    },
];

let MOCK_NUTRITION_PLANS: NutritionPlan[] = [
    { id: 'nplan_1', name: 'Lean Bulk Meal Plan', schedule: { day: 'Everyday', session: 'Anytime', startTime: '' }, notes: '3000 calories, high protein.', media: [{id: 'nm1', type: 'image', url: 'https://picsum.photos/seed/nplan1/200/300'}], meals: [{id: 'ml1', name: 'Breakfast Burrito', notes: 'Eggs, sausage, cheese, whole wheat tortilla.', media: []}] },
];

let MOCK_WORKOUT_HISTORY: WorkoutSession[] = [
    {
        id: 'sess_today',
        planId: 'plan_1',
        planName: 'Confidence Carnival',
        date: new Date().toISOString(), // Today
        duration: 30,
        planNotes: 'Focus on mind-muscle connection.',
        completedExercises: MOCK_WORKOUT_PLANS[1].exercises.map(ex => ({
            exerciseId: ex.id,
            name: ex.name,
            notes: ex.notes,
            sets: Array.from({ length: ex.sets }, (_, i) => ({ reps: 10, weight: 50 + i*5 }))
        })),
        progressMedia: [],
        caloriesBurned: 131,
    },
    {
        id: 'sess_2_days_ago',
        planId: 'plan_2',
        planName: 'Groove & Gains Time',
        date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago (this week)
        duration: 42,
        planNotes: 'A fun, full-body workout.',
        completedExercises: MOCK_WORKOUT_PLANS[2].exercises.map(ex => ({
            exerciseId: ex.id,
            name: ex.name,
            notes: ex.notes,
            sets: Array.from({ length: ex.sets }, (_, i) => ({ reps: 12, weight: 16 }))
        })),
        progressMedia: [],
        caloriesBurned: 390,
    },
    {
        id: 'sess_last_week',
        planId: 'plan_0',
        planName: 'Full Body Strength',
        date: new Date(Date.now() - 86400000 * 8).toISOString(), // 8 days ago (last week)
        duration: 55,
        planNotes: 'A foundational plan for building overall strength.',
        completedExercises: MOCK_WORKOUT_PLANS[0].exercises.map(ex => ({
            exerciseId: ex.id,
            name: ex.name,
            notes: ex.notes,
            sets: Array.from({ length: ex.sets }, (_, i) => ({ reps: 8, weight: 80 + i*5 }))
        })),
        progressMedia: [],
        caloriesBurned: 450,
    }
];

let MOCK_MESSAGES: ChatMessage[] = [];

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'notif_1', type: 'like', user: MOCK_USERS['user_2'], post: MOCK_POSTS[2], timestamp: new Date(Date.now() - 10000).toISOString(), isRead: false },
    { id: 'notif_2', type: 'comment', user: MOCK_USERS['user_1'], post: MOCK_POSTS[0], timestamp: new Date(Date.now() - 3600000).toISOString(), isRead: false },
    { id: 'notif_3', type: 'friend_request', user: MOCK_USERS['user_6'], timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: true },
    { id: 'notif_4', type: 'share', user: MOCK_USERS['user_3'], post: MOCK_POSTS[4], timestamp: new Date(Date.now() - 172800000).toISOString(), isRead: true },
];

const MOCK_MARKETPLACE_LISTINGS: MarketplaceListing[] = [
    { id: 'item_1', title: 'Adjustable Dumbbells (Pair)', price: 120, description: 'Slightly used adjustable dumbbells, up to 25kg each. Perfect for home workouts.', imageUrl: 'https://picsum.photos/seed/item1/300/300', seller: MOCK_USERS['user_3'] },
    { id: 'item_2', title: 'Yoga Mat', price: 25, description: 'High-quality, non-slip yoga mat. Brand new in packaging.', imageUrl: 'https://picsum.photos/seed/item2/300/300', seller: MOCK_USERS['user_4'] },
    { id: 'item_3', title: 'Weightlifting Belt', price: 40, description: 'Leather weightlifting belt, size M. Great support for heavy lifts.', imageUrl: 'https://picsum.photos/seed/item3/300/300', seller: MOCK_USERS['user_2'] },
    { id: 'item_4', title: 'Unopened Whey Protein', price: 50, description: '1kg tub of chocolate whey protein. Expiry date is next year.', imageUrl: 'https://picsum.photos/seed/item4/300/300', seller: MOCK_USERS['user_5'] },
];

// --- SERVICE FUNCTIONS ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const authenticateUser = async (): Promise<{ uid: string }> => {
    await delay(500);
    return { uid: 'user_1' };
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    await delay(300); // Faster for profile header
    return MOCK_USERS[userId] || null;
}

export const getFeedPosts = async (): Promise<SocialPost[]> => {
    await delay(1000);
    return MOCK_POSTS.filter(p => p.privacy !== 'only me').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const getStories = async (): Promise<Story[]> => {
    await delay(700);
    return MOCK_STORIES;
};

export const createStory = async (userId: string, imageFile: File): Promise<Story> => {
    await delay(1200);
    const imageUrl = await uploadFile(imageFile);
    const user = MOCK_USERS[userId];
    if (!user) throw new Error("User not found");
    const newStory: Story = {
        id: `story_${Date.now()}`,
        user,
        imageUrl,
    };
    MOCK_STORIES.splice(1, 0, newStory);
    return newStory;
};

export const getPostsForUser = async (userId: string): Promise<SocialPost[]> => {
    await delay(800);
    return MOCK_POSTS.filter(p => p.author.id === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const createPost = async (postData: Omit<SocialPost, 'id' | 'author' | 'timestamp' | 'likes' | 'comments'>): Promise<SocialPost> => {
    await delay(1000);
    const currentUser = MOCK_USERS['user_1'];
    const newPost: SocialPost = {
        id: `post_${Date.now()}`,
        author: currentUser,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
        ...postData,
    };
    MOCK_POSTS.unshift(newPost);
    return newPost;
};

export const toggleLikePost = async (postId: string, userId: string): Promise<string[]> => {
    await delay(300);
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post) {
        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(userId);
        }
        return post.likes;
    }
    throw new Error("Post not found");
};

export const addCommentToPost = async (postId: string, content: string, authorId: string, taggedUsers: User[] = []): Promise<Comment> => {
    await delay(500);
    const post = MOCK_POSTS.find(p => p.id === postId);
    const author = MOCK_USERS[authorId];
    if (post && author) {
        const newComment: Comment = {
            id: `comment_${Date.now()}`,
            author,
            content,
            timestamp: new Date().toISOString(),
            taggedUsers,
        };
        post.comments.push(newComment);
        return newComment;
    }
    throw new Error("Post or author not found");
};

export const getPhotosForUser = async (userId: string): Promise<Media[]> => {
    await delay(600);
    const userPosts = MOCK_POSTS.filter(p => p.author.id === userId);
    const photos = userPosts.flatMap(p => p.media.filter(m => m.type === 'image'));
    return photos;
}

export const getWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
    await delay(500);
    return MOCK_WORKOUT_PLANS;
};

export const saveWorkoutPlan = async (plan: Omit<WorkoutPlan, 'id'> & { id?: string }): Promise<WorkoutPlan> => {
    await delay(1000);
    if (plan.id) {
        const index = MOCK_WORKOUT_PLANS.findIndex(p => p.id === plan.id);
        if (index > -1) {
            MOCK_WORKOUT_PLANS[index] = { ...MOCK_WORKOUT_PLANS[index], ...plan } as WorkoutPlan;
            return MOCK_WORKOUT_PLANS[index];
        }
    }
    const newPlan = { ...plan, id: `plan_${Date.now()}` } as WorkoutPlan;
    MOCK_WORKOUT_PLANS.push(newPlan);
    return newPlan;
};

export const deleteWorkoutPlan = async (planId: string): Promise<void> => {
    await delay(500);
    MOCK_WORKOUT_PLANS = MOCK_WORKOUT_PLANS.filter(p => p.id !== planId);
};

export const getNutritionPlans = async (): Promise<NutritionPlan[]> => {
    await delay(500);
    return MOCK_NUTRITION_PLANS;
};

export const saveNutritionPlan = async (plan: Omit<NutritionPlan, 'id'> & { id?: string }): Promise<NutritionPlan> => {
    await delay(1000);
    if (plan.id) {
        const index = MOCK_NUTRITION_PLANS.findIndex(p => p.id === plan.id);
        if (index > -1) {
            MOCK_NUTRITION_PLANS[index] = { ...MOCK_NUTRITION_PLANS[index], ...plan } as NutritionPlan;
            return MOCK_NUTRITION_PLANS[index];
        }
    }
    const newPlan = { ...plan, id: `nplan_${Date.now()}` } as NutritionPlan;
    MOCK_NUTRITION_PLANS.push(newPlan);
    return newPlan;
};

export const deleteNutritionPlan = async (planId: string): Promise<void> => {
    await delay(500);
    MOCK_NUTRITION_PLANS = MOCK_NUTRITION_PLANS.filter(p => p.id !== planId);
};

export const saveWorkoutSession = async (session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession> => {
    await delay(1000);
    const newSession = { ...session, id: `sess_${Date.now()}` };
    MOCK_WORKOUT_HISTORY.unshift(newSession);
    // Mark the plan as completed for the hub view
    const completedPlanIndex = MOCK_WORKOUT_PLANS.findIndex(p => p.id === session.planId);
    if (completedPlanIndex > -1) {
        // This is a temporary solution for mock data. In a real DB, you'd query sessions.
    }
    return newSession;
};

export const getWorkoutHistory = async (): Promise<WorkoutSession[]> => {
    await delay(500);
    return MOCK_WORKOUT_HISTORY.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getFriendsForUser = async (userId: string): Promise<User[]> => {
    await delay(500);
    const friendIds = MOCK_FRIENDSHIPS[userId] || [];
    return friendIds.map(id => MOCK_USERS[id]).filter(Boolean);
};

export const getSuggestedFriends = async (userId: string): Promise<User[]> => {
    await delay(700);
    const friendIds = MOCK_FRIENDSHIPS[userId] || [];
    const suggestions: User[] = [];
    let attempts = 0;
    while(suggestions.length < 10 && attempts < 100) {
        const randomUserId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
        if (randomUserId !== userId && !friendIds.includes(randomUserId) && !suggestions.some(s => s.id === randomUserId)) {
            suggestions.push(MOCK_USERS[randomUserId]);
        }
        attempts++;
    }
    return suggestions;
};

export const getMessagesForChat = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
    await delay(200);
    return MOCK_MESSAGES.filter(
        m => (m.senderId === userId1 && m.recipientId === userId2) || (m.senderId === userId2 && m.recipientId === userId1)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const sendMessage = async (senderId: string, recipientId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'audio'): Promise<ChatMessage> => {
    await delay(300);
    const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId,
        recipientId,
        text,
        mediaUrl,
        mediaType,
        timestamp: new Date().toISOString()
    };
    MOCK_MESSAGES.push(newMessage);
    return newMessage;
};

export const uploadFile = async (file: File): Promise<string> => {
    await delay(1500);
    // In a real app, this would upload to a storage service and return the URL.
    // For this mock, we'll return a placeholder URL.
    console.log(`Uploading ${file.name}...`);
    return `https://picsum.photos/600/400?random=${Date.now()}`;
};

export const searchMusic = async (query: string): Promise<Song[]> => {
    await delay(500);
    console.log('Searching for music:', query);
    return Object.values(MOCK_SONGS);
}

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    await delay(600);
    // Filter for notifications relevant to the user (mock logic)
    return MOCK_NOTIFICATIONS.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getMarketplaceListings = async (): Promise<MarketplaceListing[]> => {
    await delay(800);
    return MOCK_MARKETPLACE_LISTINGS;
};