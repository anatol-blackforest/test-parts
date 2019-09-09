redis = require('redis');

class RedisService {
  constructor(options) {
    this.db = redis.createClient({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: 6379,
      retry_strategy: (options) => {
        if (options.attempt > 5) return null;
        return Math.min(options.attempt * 100, 3000);
      }
    });
    this.lifetime = 300;
    this.db.on('connect', () => {
      console.log('[REDIS::CONNECTED]');
    });

    this.db.on("error", (err) => {
      console.log("Error " + err);
    });

    this.db.on("end", function() {
      console.log("Redis connection closed!");
    });

  }

  async get(mask) {
    return await new Promise((resolve, reject) => {
      if (this.db.connected) {
        this.db.get(mask, (err, reply) => {
          if(err) reject(err);
          resolve(reply)
        });
      } else {
        resolve(this.emptyReply());
      }
    });
  }

  async set(key, value) {
    if (this.db.connected) {
      return this.db.set(key, value, 'EX', this.lifetime);
    } else {
      return this.emptyReply();
    }
  }

  async delete(mask) {
    return await new Promise((resolve, reject) => {
      if (this.db.connected) {
        this.db.keys(mask, (err, rows) => {
          if (err) reject(err);
          rows.filter(row => {
            this.db.del(row);
            return false;
          })
        });
        resolve(true);
      } else {
        resolve(this.emptyReply());
      }
    });
  }

  async update(mask) {
    return await new Promise((resolve, reject) => {

    });
  }

  emptyReply() {
    return null;
  }
}

module.exports = new RedisService();