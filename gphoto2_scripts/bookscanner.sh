#!/bin/bash

export LEFT_CAM_STATUS_PIPE=/tmp/left_status_pipe
export RIGHT_CAM_STATUS_PIPE=/tmp/right_status_pipe

export BOOK_NAME="ChaturacharyaCharitra"

export RIGHT_CAM_PAGE_NUM=1
export LEFT_CAM_PAGE_NUM=2

source /home/pi/git/spreads/gphoto2_scripts/setCameraEnv.sh

rotateAndCrop()
{
	FILENAME_PREFIX=$1
	ROTATION_ANGLE=$2
	convert -rotate "$ROTATION_ANGLE" ${FILENAME_PREFIX}_raw.jpg ${FILENAME_PREFIX}_rotated.jpg
	if [[ $ROTATION_ANGLE == "-90" ]]
	then
		convert ${FILENAME_PREFIX}_rotated.jpg -crop 1680x2670+2220+1175 ${FILENAME_PREFIX}.jpg
	else
		convert ${FILENAME_PREFIX}_rotated.jpg -crop 1570x2490+220+1095 ${FILENAME_PREFIX}.jpg
	fi

	rm ${newfilename_prefix}_raw.jpg
	rm ${newfilename_prefix}_rotated.jpg
}

captureAndProcess()
{
	CAM_MODEL=$1
	SUBCOMMAND=$2
	PAGENUM=$3
	ROTATION_ANGLE=$4
	newfilename_prefix=`printf "%s_%04d" $BOOK_NAME $PAGENUM`
	gphoto2 ${SUBCOMMAND} --camera="$CAM_MODEL" --filename=${newfilename_prefix}_raw.jpg
	rotateAndCrop ${newfilename_prefix} $ROTATION_ANGLE &
}


captureImageFromCamera()
{
	if [[ $1 == "left_cam" ]]
	then
		captureAndProcess "$LEFT_CAM_MODEL" '--capture-image-and-download' $LEFT_CAM_PAGE_NUM "90"
		echo "done" > $LEFT_CAM_STATUS_PIPE
	else
		captureAndProcess "$RIGHT_CAM_MODEL" '--trigger-capture --wait-event-and-download=FILEADDED' $RIGHT_CAM_PAGE_NUM "-90"
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

