const mysql = require('mysql');
const redis = require('../services/redis.service.js');
const crypto = require('crypto');
const _ = require('lodash');

const options = {
  host: process.env.DB_HOST || 'ec2-52-14-100-53.us-east-2.compute.amazonaws.com',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'tizen_101',
  database: process.env.DB_NAME || 'dev-dWall',
  charset: process.env.DB_CHARSET || 'utf8_general_ci'
}

class MySQL {
  constructor(options) {
    this.connection = mysql.createConnection(options);
    this.redis = redis;
    this.prefix = `dWall-${process.env.environment}`;
    this.connection.connect(this.isConnected);
    this.connection.config.queryFormat = function (query, values) {
      if (!values) return query;
      return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
          return this.escape(values[key]);
        }
        return txt;
      }.bind(this));
    };
  }

  async runQuery(query) {
    try{
      const re = /select/gmi;
      var guid = "aaaa-bbbb-cccc-dddd";
      var sqlHash = crypto.createHash('md5').update(sql).digest('hex');
      var sqlParams = crypto.createHash('md5').update(JSON.stringify('default')).digest('hex');
      var key = `dWall:${guid}:${sqlHash}:${sqlParams}`;
      let data = [];
      data = await this.redis.get(key);
      if (!data) {
        data = await this._exec(sql, params);
        this.redis.set(key, JSON.stringify(data));
      }  else {
        data = JSON.parse(data);
      }
      return data;
    } catch(err) {
      console.log('[SQL::ERROR]', err);
    }
  }

  async query(sql, params = {}, table = null) {
    try{
      const reSelect = /select/gmi;
      const reCreate = /insert/gmi;
      const sqlHash = crypto.createHash('md5').update(sql).digest('hex');
      const sqlParams = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
      let key = `${this.prefix}:${table}:${sqlHash}:${sqlParams}`;
      let data = [];
      if (reSelect.test(sql)) {
        data = table ? await this.redis.get(key) : null;
        if (!data) {
          data = await this._exec(sql, params);
          if (table) this.redis.set(key, JSON.stringify(data));
        }  else {
          data = JSON.parse(data);
        }
      } else {
        data = await this._exec(sql, params);
        if (table) this.redis.delete(`${this.prefix}:${table}:*`);
      }

      return data;
    } catch(err) {
      console.log('[SQL::ERROR]', err);
    }
  }

  setNewCreds (host, user, pass, database) {
    this.connection = mysql.createConnection({
      host     : host,
      user     : user,
      password : pass,
      database : database
    });
    this.connection.config.queryFormat = function (query, values) {
      if (!values) return query;
      return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
          return this.escape(values[key]);
        }
        return txt;
      }.bind(this));
    };
  }

  disconnect() {
    this.connection.end();
  }

  rollback() {
    return new Promise((resolve, reject) => {
      resolve(this.connection.rollback());
    });
  }

  validate(SQLquery) {
    var check = SQLquery.match(/(?<=')(\w*(')\w*)(?=')/g);
    return SQLquery.replace(/'(')'/gi, '\'');
  }

  prepareQuery(base, params) {
    let temp;
    if (params.set) {
      base += ' SET';
      _.forEach(params.set, (value, key) => {
        temp = '';
        value = value == null ? value : `:${key}`;
        temp = ` \`${key}\`= ${value},`;
        base += temp;
      })
      base = base.slice(0, -1);
    }
    if (params.where) {
      base += ' WHERE';
       _.forEach(params.where, (value, key) => {
        temp = '';
        temp = ` \`${key}\`= :${key} AND`;
        base += temp;
      });
      base = base.slice(0, -3);
    }

    return base;
  }

  isConnected(err) {
    if (err) {
      console.error('[DB_CONNECT::ERROR]', err);
      return;     
    }
    console.log('[DB_CONNECT::ESTABLISHED]');
  }

  async _exec(sql, params) {
    //console.log('[SQL]', sql, params);
    try {
      if ((this.connection.state == "disconnected")) this.connection = mysql.createConnection(options);
      return await new Promise((resolve, reject) => {
        this.connection.query(sql, params, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      })
      .then(data => {
        return data;
      })
      .catch(err => {
        console.log('[Error]', err);
      });
    } catch(err) {
      console.log('[Error]', err);
    }
  }
}

module.exports = new MySQL(options);
