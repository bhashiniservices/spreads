#!/bin/bash

export LEFT_CAM_STATUS_PIPE=/tmp/left_status_pipe
export RIGHT_CAM_STATUS_PIPE=/tmp/right_status_pipe

export BOOK_NAME="ChaturacharyaCharitra"

export RIGHT_CAM_PAGE_NUM=1
export LEFT_CAM_PAGE_NUM=2

source /home/pi/git/spreads/gphoto2_scripts/setCameraEnv.sh

# arg1 : port
# arg2 : folder
captureImageFromCamera()
{
	if [[ $1 == "left_cam" ]]
	then
		newfilename=`printf "%s_%04d_raw.jpg" $BOOK_NAME $LEFT_CAM_PAGE_NUM`
		gphoto2 --capture-image-and-download --camera="$LEFT_CAM_MODEL" --filename=$newfilename
		echo "done" > $LEFT_CAM_STATUS_PIPE
	else
		newfilename=`printf "%s_%04d_raw.jpg" $BOOK_NAME $RIGHT_CAM_PAGE_NUM`
		gphoto2 --trigger-capture --wait-event-and-download=FILEADDED --camera="$RIGHT_CAM_MODEL" --filename=$newfilename
		echo "done" > $RIGHT_CAM_STATUS_PIPE
	fi
}

main()
{
	mkfifo $LEFT_CAM_STATUS_PIPE
	mkfifo $RIGHT_CAM_STATUS_PIPE
	while [[ true ]]
	do
		echo "Press ENTER to continue scanning"
		read
		captureImageFromCamera "left_cam" &
		captureImageFromCamera "right_cam" &
		read < $LEFT_CAM_STATUS_PIPE
		read < $RIGHT_CAM_STATUS_PIPE
		((LEFT_CAM_PAGE_NUM=LEFT_CAM_PAGE_NUM+2))
		((RIGHT_CAM_PAGE_NUM=RIGHT_CAM_PAGE_NUM+2))
	done
}

main

