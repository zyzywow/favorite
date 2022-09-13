const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(
  session({
    secret: "아무거나",
    resave: true, // 강제로 재 저장하겠느냐,..
    saveUninitialized: false, // 빈값을 저장하겠느냐..
    cookie: { maxAge: 1000 * 60 * 60 }, // milli second로 시간 설정
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      // input name을 쓰는 것
      usernameField: "userID", // 속성중에 name속성으로 찾아서 쓰면 된다. id랑 관계없음
      passwordField: "userPW",
      session: true,
      passReqToCallback: false,
    },
    (id, password, done) => {
      console.log(id, "===", password);
      db.collection("member").findOne({ userID: id }, (err, result) => {
        if (err) {
          return done(err);
        }
        if (!result) return done(null, false, { message: "존재하지 않는 아이디 입니다." });
        if (result) {
          if (password === result.userPW) {
            console.log("로그인 성공");
            return done(null, result);
          } else {
            console.log("로그인 실패");
            return done(null, false, { message: "password를 확인해주세요." });
          }
        }
      });
    }
  )
);
passport.serializeUser((user, done) => {
  // console.log("serializeUser===", user);
  done(null, user.userID);
});
passport.deserializeUser((id, done) => {
  db.collection("member").findOne({ userID: id }, (err, result) => {
    // console.log(result);
    done(null, result);
  });
});

const MongoClient = require("mongodb").MongoClient;
const htmlParser = require("node-html-parser");

let db = null;
MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log(err);
  }
  db = client.db("crudapp");
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false })); // post에서 보낸 데이터 req.body로 받을려면 있어야함
app.use(express.static(path.join(__dirname, "/public")));
app.use("/upload", express.static(path.join(__dirname, "/upload")));
app.set("port", process.env.PORT || 8099);
const PORT = app.get("port");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, done) => {
    done(null, path.join(__dirname, "/upload"));
  },
  filename: (req, file, done) => {
    done(null, file.originalname);
  },
});

const fileUpload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("index", { title: "......", userInfo: req.user });
});
app.get("/login", (req, res) => {
  res.render("login", { title: "login" });
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/",
  })
);
app.get("/logout", (req, res) => {
  if (req.user) {
    req.session.destroy();
    // res.redirect("/");
    res.send(`<script>alert("로그아웃되었습니다.");location.href="/";</script>`);
  }
});
app.get("/join", (req, res) => {
  res.render("join", { title: "join" });
});
app.post("/registerUSER", (req, res) => {
  const userID = req.body.userID;
  const userPW = req.body.userPW;
  const userName = req.body.userName;
  const userEmail = req.body.userEmail;
  const userZipcode = req.body.zipCode;
  const userAddress = req.body.address01 + "/" + req.body.address02;
  const userGender = req.body.gender;
  const userJob = req.body.job;
  // 1번째방법 - 넘어온 값은 서버에서 처리하기..
  console.log(userID);
  console.log(userPW);
  console.log(userName);
  console.log(userEmail);
  console.log(userZipcode);
  console.log(userAddress);
  console.log(userGender);
  console.log(userJob);
  const insertData = {
    userID: userID,
    userPW: userPW,
    userName: userName,
    userEmail: userEmail,
    userZipcode: userZipcode,
    userAddress: userAddress,
    userGender: userGender,
    userJob: userJob,
  };
  db.collection("member").insertOne(insertData, (err, result) => {
    if (err) {
      console.log(err);
      res.send(`<script>alert("알 수 없는 오류로 회원가입이 되지 않았습니다. 잠시 후 다시 시도해 주세요."); location.href="/"</script>`);
    }
    // res.redirect("/login");
    res.send(`<script>alert("회원가입이 완료되었습니다."); location.href="/login"</script>`);
    // res.redirect("registerSuccess");
  });
});
app.get("/mypage", isLogged, (req, res) => {
  // console.log(req.user);
  res.render("mypage", { title: "mypage", userInfo: req.user });
});
app.get("/modify", (req, res) => {
  res.render("modify", { title: "modify" });
});
app.post("/modify", (req, res) => {
  const userID = req.body.userID;
  const userPW = req.body.userPW;
  const userName = req.body.userName;
  const userEmail = req.body.userEmail;
  const userZipcode = req.body.zipCode;
  const userAddress = req.body.address01 + "/" + req.body.address02;
  const userGender = req.body.gender;
  const userJob = req.body.job;

  db.collection("member").updateOne(
    { userID: userID },
    {
      $set: {
        userPW: userPW,
        userName: userName,
        userEmail: userEmail,
        userZipcode: userZipcode,
        userAddress: userAddress,
        userGender: userGender,
        userJob: userJob,
      },
    },
    (err, result) => {
      if (err) {
        console.log(err);
      }
      // console.log(result);
      res.send(`<script>alert("회원정보 수정이 되었습니다.");location.href="/";</script>`);
    }
  );
});
app.get("/delete", (req, res) => {
  res.render("delete", { title: "Member Delete" });
});
app.post("/delete", (req, res) => {
  // console.log(req.user.userID);
  const userPW = req.body.userPW;
  db.collection("member").deleteOne({ userID: req.user.userID, userPW: userPW }, (err, result) => {
    // console.log(result);
    if (result.deletedCount > 0) {
      res.send(`<script>alert("회원탈퇴 되었습니다.");location.href="/"</script>`);
    } else {
      res.send(`<script>alert("비밀번호 확인해주세요.");location.href="/delete";</script>`);
    }
  });
});
function isLogged(req, res, next) {
  if (req.user) {
    next(); // next 필수!!!! 안적으면 다음단계로들어갈수없음
  } else {
    res.send(`<script>alert("로그인 먼저 하셔야 합니다.");location.href="/login";</script>`);
  }
}
app.get("/insert", (req, res) => {
  res.render("insert", { title: "글 쓰기" });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/",
  })
);
app.post("/register", fileUpload.single("image"), (req, res) => {
  const title = req.body.title;
  const date = req.body.date;
  const category = Array.isArray(req.body.category) ? req.body.category.join(" ") : req.body.category;
  const desc = req.body.desc;
  const point = req.body.point;
  const image = req.file.filename;
  cloudinary.uploader.upload(req.file.path, (result) => {
    console.log(db.collection("blog"));
    db.collection("blog").insertOne({
      title: title,
      date: date,
      category: category,
      desc: desc,
      point: point,
      image: result.url,
    });
    res.send("잘들어갔습니다.");
  });
});

app.get("/list", (req, res) => {
  db.collection("blog")
    .find()
    .toArray((err, result) => {
      res.render("list", { title: "list", list: result });
    });
});
app.get("/detail/:title", (req, res) => {
  const title = req.params.title;
  db.collection("blog").findOne({ title: title }, (err, result) => {
    if (result) {
      res.render("detail", { title: "detail", data: result });
    }
  });
});
app.post("/summerNoteInsertImg", fileUpload.single("summerNoteImg"), (req, res) => {
  cloudinary.uploader.upload(req.file.path, (result) => {
    res.json({ cloudinaryImgSrc: result.url });
  });
});
app.post("/idCheck", (req, res) => {
  const userID = req.body.userID;
  db.collection("member").findOne({ userID: userID }, (err, result) => {
    console.log(result);
    if (result === null) {
      res.json({ isOk: true });
    } else {
      res.json({ isOk: false });
    }
  });
});

app.listen(PORT, () => {
  console.log(`${PORT}에서 서버 대기중5`);
});