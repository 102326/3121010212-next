# Legacy Analysis

Source: `D:\daima\3121010212`

## Current Shape

- Maven WAR style Java project.
- Spring MVC controllers under `src/main/java/com/controller`.
- MyBatis-Plus 2.x style service/dao/entity layers.
- MySQL schema dump at `db/ssm34vs8aq0.sql`.
- Static web resources under `src/main/webapp`.

## Controller Modules Observed

- `users`: admin login, register, session, reset password, CRUD.
- `yonghu`: student/user login, register, profile, audit batch, stats.
- `zixunshi`: counselor login, register, profile, audit batch, stats.
- `jiankangzhishi`: health knowledge list/detail/CRUD/audit.
- `news` and `newstype`: news/articles, categories, likes, sorting.
- `wenzhangleixing`: article type management.
- `yuyuexinxi`: appointment information and status audit.
- `quxiaoyuyue`: cancellation records.
- `forum`, `forumtype`, `forumreport`: forum, categories, reports.
- `discussjiankangzhishi`, `discusszixunshi`: comments.
- `exampaper`, `examquestion`, `examquestionbank`, `examrecord`: assessment/exam flow.
- `chengjixinxi`, `ceshirenshu`, `scoredetermination`: score and assessment result stats.
- `storeup`: favorites.
- `friend`, `chatmessage`: friendship/chat modules.
- `file`, `config`, `systemintro`, `aboutus`, `common`: shared platform features.

## MySQL Tables Observed

The SQL dump includes core business tables such as:

- `users`, `yonghu`, `zixunshi`, `token`
- `jiankangzhishi`, `wenzhangleixing`, `news`, `newstype`
- `yuyuexinxi`, `quxiaoyuyue`
- `forum`, `forumtype`, `forumreport`
- `exampaper`, `examquestion`, `examquestionbank`, `examrecord`
- `chengjixinxi`, `ceshirenshu`, `scoredetermination`
- `storeup`, `friend`, `chatmessage`
- `aboutus`, `systemintro`, `config`

## Migration Judgment

Do not translate all tables mechanically. The first PostgreSQL schema should normalize the main product loop:

1. One unified `users` table with roles.
2. `counselors` as a profile attached to a user when needed.
3. `article_categories` and `articles` for health knowledge and news-like content.
4. `appointments` with an explicit status lifecycle.

The forum, assessment, file upload, and configuration modules should be added after the first demo loop is stable.
