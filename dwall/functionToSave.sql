DROP FUNCTION IF EXISTS checkIfVideoThere; 
DELIMITER $$
CREATE FUNCTION checkIfVideoThere (_url varchar(255), userId int) 
RETURNS varchar(255)
DETERMINISTIC
BEGIN 
  declare status varchar(255);
  select count(id) from video 
  where url = _url
  and user_id = userId into status;
  if status = 0 then
   insert into video (url, user_id)
   values (_url,userId);
  end if;
  RETURN status;
END$$
DELIMITER ;

select checkIfVideoThere('someBrandNewURL',2);


