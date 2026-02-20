FROM public.ecr.aws/lambda/python:3.12

RUN dnf update -y && \
    dnf install -y gcc gcc-c++ python3-devel mesa-libGL glib2 && \
    dnf clean all

COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install --upgrade pip wheel

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ${LAMBDA_TASK_ROOT}

CMD [ "app.lambda_handler" ]